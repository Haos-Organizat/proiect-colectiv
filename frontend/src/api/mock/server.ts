import type {
  ApiErrorBody,
  EventDetail,
  EventSummary,
  Order,
  OrganizerEvent,
  Ticket,
  User,
} from '@/types/api';
import { ApiError } from '../client';
import type { EventPayload } from '../endpoints';
import { MOCK_PASSWORD, seedEvents, seedUsers } from './data';

/*
 * In-browser fake backend for VITE_USE_MOCKS=true. It follows docs/api-contract.md:
 * same paths, same response shapes, same error codes. State survives reloads via
 * localStorage; clear "uc-mock-db" (or call window.ucResetMocks()) to start over.
 */

interface Db {
  users: (User & { password: string })[];
  sessionUserId: string | null;
  events: OrganizerEvent[];
  tickets: (Ticket & { ownerId: string })[];
}

const STORAGE_KEY = 'uc-mock-db';
/** Fake network delay. Set localStorage "uc-mock-latency" (ms) to test loading states. */
function latency() {
  try {
    const custom = Number(localStorage.getItem('uc-mock-latency'));
    if (Number.isFinite(custom) && custom > 0) return custom;
  } catch {
    // Storage blocked: use the default.
  }
  return 350;
}

function freshDb(): Db {
  return {
    users: seedUsers.map((u) => ({ ...u, password: MOCK_PASSWORD })),
    sessionUserId: null,
    events: structuredClone(seedEvents),
    tickets: [],
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    // Storage blocked or corrupt: fall back to fresh seed data.
  }
  return freshDb();
}

let db = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Mock state then only lives in memory for this tab.
  }
}

declare global {
  interface Window {
    ucResetMocks?: () => void;
  }
}
window.ucResetMocks = () => {
  db = freshDb();
  save();
  location.reload();
};

function fail(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): never {
  const error: ApiErrorBody['error'] = { code, message, fields };
  throw new ApiError(status, error);
}

function currentUser() {
  const user = db.users.find((u) => u.id === db.sessionUserId);
  if (!user) fail(401, 'unauthenticated', 'Log in to continue.');
  return user;
}

function publicUser(record: User & { password: string }): User {
  const user: Partial<typeof record> = { ...record };
  delete user.password;
  return user as User;
}

function publicTicket(record: Ticket & { ownerId: string }): Ticket {
  const ticket: Partial<typeof record> = { ...record };
  delete ticket.ownerId;
  return ticket as Ticket;
}

function summary(e: OrganizerEvent): EventSummary {
  const { id, slug, title, category, startsAt, endsAt, venue, city, imageUrl, price, ticketsLeft } =
    e;
  return { id, slug, title, category, startsAt, endsAt, venue, city, imageUrl, price, ticketsLeft };
}

function detail(e: OrganizerEvent): EventDetail {
  return {
    ...summary(e),
    description: e.description,
    organizer: e.organizer,
    capacity: e.capacity,
    maxPerOrder: e.maxPerOrder,
  };
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  let slug = base;
  for (let n = 2; db.events.some((e) => e.slug === slug); n++) slug = `${base}-${n}`;
  return slug;
}

function randomCode(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    crypto.getRandomValues(new Uint8Array(length)),
    (b) => alphabet[b % alphabet.length],
  ).join('');
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Handler = (ctx: { params: string[]; query: URLSearchParams; body: unknown }) => unknown;

const routes: [string, RegExp, Handler][] = [
  // Auth
  ['GET', /^\/auth\/me$/, () => publicUser(currentUser())],
  [
    'POST',
    /^\/auth\/login$/,
    ({ body }) => {
      const { email, password } = body as { email: string; password: string };
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password !== password) {
        fail(401, 'invalid_credentials', 'Email or password is incorrect.');
      }
      db.sessionUserId = user.id;
      return publicUser(user);
    },
  ],
  [
    'POST',
    /^\/auth\/register$/,
    ({ body }) => {
      const input = body as Omit<User, 'id'> & { password: string };
      if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        fail(409, 'email_taken', 'An account with this email already exists.', {
          email: 'An account with this email already exists.',
        });
      }
      const user = { ...input, id: `u_${randomCode(8)}` };
      db.users.push(user);
      db.sessionUserId = user.id;
      return publicUser(user);
    },
  ],
  [
    'POST',
    /^\/auth\/logout$/,
    () => {
      db.sessionUserId = null;
      return undefined;
    },
  ],

  // Public events
  [
    'GET',
    /^\/events$/,
    ({ query }) => {
      const category = query.get('category');
      const q = query.get('q')?.toLowerCase();
      return db.events
        .filter((e) => e.status === 'published' && new Date(e.endsAt) > new Date())
        .filter((e) => !category || e.category === category)
        .filter((e) => !q || e.title.toLowerCase().includes(q))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map(summary);
    },
  ],
  [
    'GET',
    /^\/events\/([^/]+)$/,
    ({ params }) => {
      const event = db.events.find((e) => e.slug === params[0] && e.status === 'published');
      if (!event) fail(404, 'not_found', 'This event does not exist or was removed.');
      return detail(event);
    },
  ],

  // Orders and tickets
  [
    'POST',
    /^\/orders$/,
    ({ body }) => {
      const user = currentUser();
      const { eventId, quantity } = body as { eventId: string; quantity: number };
      const event = db.events.find((e) => e.id === eventId && e.status === 'published');
      if (!event) fail(404, 'not_found', 'This event does not exist or was removed.');
      if (event.ticketsLeft === 0) fail(409, 'sold_out', 'This event is sold out.');
      if (quantity > event.ticketsLeft) {
        fail(409, 'not_enough_tickets', `Only ${event.ticketsLeft} tickets are left.`, {
          quantity: `Only ${event.ticketsLeft} tickets are left.`,
        });
      }
      if (quantity < 1 || quantity > event.maxPerOrder) {
        fail(422, 'validation_error', 'Check the quantity.', {
          quantity: `You can buy between 1 and ${event.maxPerOrder} tickets.`,
        });
      }
      const purchasedAt = new Date().toISOString();
      const tickets = Array.from({ length: quantity }, () => {
        const code = `UC-${randomCode(4)}-${randomCode(4)}`;
        return {
          id: `t_${randomCode(10)}`,
          code,
          qrPayload: `uc1.${event.id}.${code}.${randomCode(16)}`,
          status: 'valid' as const,
          holderName: user.name,
          purchasedAt,
          ownerId: user.id,
          event: {
            id: event.id,
            slug: event.slug,
            title: event.title,
            startsAt: event.startsAt,
            venue: event.venue,
            city: event.city,
            imageUrl: event.imageUrl,
          },
        };
      });
      event.ticketsLeft -= quantity;
      event.ticketsSold += quantity;
      event.revenue = {
        ...event.revenue,
        amount: event.revenue.amount + event.price.amount * quantity,
      };
      db.tickets.push(...tickets);
      const order: Order = {
        id: `o_${randomCode(10)}`,
        eventId,
        quantity,
        total: { amount: event.price.amount * quantity, currency: event.price.currency },
        tickets: tickets.map(publicTicket),
        emailedTo: user.email,
      };
      return order;
    },
  ],
  [
    'GET',
    /^\/me\/tickets$/,
    () => {
      const user = currentUser();
      return db.tickets
        .filter((t) => t.ownerId === user.id)
        .map(publicTicket)
        .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
    },
  ],
  [
    'GET',
    /^\/me\/tickets\/([^/]+)$/,
    ({ params }) => {
      const user = currentUser();
      const ticket = db.tickets.find((t) => t.id === params[0] && t.ownerId === user.id);
      if (!ticket) fail(404, 'not_found', 'Ticket not found.');
      return publicTicket(ticket);
    },
  ],

  // Organizer
  [
    'GET',
    /^\/organizer\/events$/,
    () => {
      const user = requireOrganizer();
      return db.events
        .filter((e) => e.organizer.id === user.id)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    },
  ],
  ['GET', /^\/organizer\/events\/([^/]+)$/, ({ params }) => ownEvent(params[0])],
  [
    'POST',
    /^\/organizer\/events$/,
    ({ body }) => {
      const user = requireOrganizer();
      const input = body as EventPayload;
      const event: OrganizerEvent = {
        ...input,
        // The photo is optional; fall back to a neutral campus shot.
        imageUrl: input.imageUrl || '/mock/events/hero.webp',
        id: `e_${randomCode(8)}`,
        slug: slugify(input.title),
        organizer: { id: user.id, name: user.name },
        ticketsLeft: input.capacity,
        ticketsSold: 0,
        revenue: { amount: 0, currency: 'RON' },
      };
      db.events.push(event);
      return event;
    },
  ],
  [
    'PATCH',
    /^\/organizer\/events\/([^/]+)$/,
    ({ params, body }) => {
      const event = ownEvent(params[0]);
      const input = body as Partial<EventPayload> | { status: 'cancelled' };
      Object.assign(event, input);
      if ('capacity' in input && typeof input.capacity === 'number') {
        if (input.capacity < event.ticketsSold) {
          fail(422, 'validation_error', 'Capacity is below tickets already sold.', {
            capacity: `At least ${event.ticketsSold} tickets are already sold.`,
          });
        }
        event.ticketsLeft = input.capacity - event.ticketsSold;
      }
      return event;
    },
  ],
  [
    'POST',
    /^\/organizer\/uploads$/,
    async ({ body }) => {
      requireOrganizer();
      const file = (body as FormData).get('file');
      if (!(file instanceof File))
        fail(422, 'validation_error', 'Choose an image.', { file: 'Choose an image.' });
      if (file.size > 5 * 1024 * 1024) {
        fail(413, 'file_too_large', 'Images must be under 5 MB.', {
          file: 'Images must be under 5 MB.',
        });
      }
      return { url: await readFile(file) };
    },
  ],
];

function requireOrganizer() {
  const user = currentUser();
  if (user.role !== 'organizer') fail(403, 'forbidden', 'Only organizer accounts can do this.');
  return user;
}

function ownEvent(id: string) {
  const user = requireOrganizer();
  const event = db.events.find((e) => e.id === id && e.organizer.id === user.id);
  if (!event) fail(404, 'not_found', 'Event not found.');
  return event;
}

export async function mockRequest<T>(method: string, fullPath: string, body: unknown): Promise<T> {
  await new Promise((r) => setTimeout(r, latency()));
  const [path, qs = ''] = fullPath.split('?');
  for (const [m, pattern, handler] of routes) {
    const match = m === method ? pattern.exec(path) : null;
    if (!match) continue;
    const result = await handler({
      params: match.slice(1).map(decodeURIComponent),
      query: new URLSearchParams(qs),
      body,
    });
    save();
    // Return copies so callers can never mutate the mock database by accident.
    return (result === undefined ? undefined : structuredClone(result)) as T;
  }
  fail(404, 'not_found', `Mock has no route for ${method} ${path}.`);
}
