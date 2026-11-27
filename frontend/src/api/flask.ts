import type { EventCategory, EventSummary, User } from '@/types/api';
import { ApiError, request } from './client';

/*
 * Adapters for the endpoints the Flask backend implements today. Its JSON uses
 * snake_case and Romanian names; these functions translate to and from the frontend
 * types so pages never see the difference. docs/api-contract.md, section 3, lists the
 * exact request and response shapes.
 */

interface FlaskUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
  role: 'participant' | 'organizator' | 'admin';
  status: 'activ' | 'inactiv';
}

function toUser(u: FlaskUser): User {
  return {
    id: String(u.id),
    name: `${u.first_name} ${u.last_name}`.trim(),
    email: u.email,
    role: u.role === 'admin' ? 'admin' : u.role === 'organizator' ? 'organizer' : 'student',
    university: null,
  };
}

/** Re-throws API errors with the backend's field names mapped to the form's. */
function mapFieldErrors(names: Record<string, string>) {
  return (err: unknown): never => {
    throw err instanceof ApiError ? err.withFieldNames(names) : err;
  };
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const flaskAuth = {
  me: () => request<FlaskUser>('/auth/me').then(toUser),

  login: (body: { email: string; password: string }) =>
    request<FlaskUser>('/auth/login', { method: 'POST', body }).then(toUser),

  // /api/auth/register creates the account but does not start a session, so log in
  // right after; otherwise the user looks signed in until the next page load.
  register: (input: RegisterInput) =>
    request<FlaskUser>('/auth/register', {
      method: 'POST',
      body: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        password: input.password,
        confirm_password: input.confirmPassword,
      },
    })
      .then(() => flaskAuth.login({ email: input.email, password: input.password }))
      .catch(
        mapFieldErrors({
          first_name: 'firstName',
          last_name: 'lastName',
          confirm_password: 'confirmPassword',
        }),
      ),

  logout: () => request<unknown>('/auth/logout', { method: 'POST' }).then(() => undefined),
};

/** Frontend category -> value accepted by the backend validator (CATEGORII_PRINCIPALE). */
const CATEGORY_TO_FLASK: Record<EventCategory, string> = {
  sport: 'sport',
  tech: 'IT',
  culture: 'cultură',
  party: 'petreceri',
  volunteering: 'voluntariat',
  education: 'educație',
  other: 'altele',
};

const FLASK_TO_CATEGORY: Record<string, EventCategory> = {
  sport: 'sport',
  it: 'tech',
  tehnologie: 'tech',
  tech: 'tech',
  cultura: 'culture',
  cultură: 'culture',
  cultural: 'culture',
  culture: 'culture',
  arta: 'culture',
  artă: 'culture',
  petrecere: 'party',
  petreceri: 'party',
  party: 'party',
  voluntariat: 'volunteering',
  volunteering: 'volunteering',
  educatie: 'education',
  educație: 'education',
  education: 'education',
  academic: 'education',
  academice: 'education',
  conferinta: 'education',
  conferință: 'education',
  altele: 'other',
  other: 'other',
  social: 'other',
  sociale: 'other',
  muzica: 'other',
  muzică: 'other',
  concert: 'other',
  cariera: 'other',
  carieră: 'other',
  career: 'other',
  workshop: 'other',
};

interface FlaskEventItem {
  id: number | string;
  slug?: string;
  title?: string;
  titlu?: string;
  category?: string;
  categorie?: string;
  startsAt?: string;
  data_ora?: string;
  endsAt?: string;
  venue?: string;
  loc?: string;
  city?: string;
  imageUrl?: string;
  poza?: string | null;
  price?: { amount: number; currency: 'RON' };
  capacity?: number;
  numar_locuri?: number;
  locuri?: number;
  ticketsLeft?: number;
  locuri_ramase?: number;
}

function toEventSummary(raw: FlaskEventItem): EventSummary {
  const id = String(raw.id);
  const startsAt = raw.startsAt ?? raw.data_ora ?? new Date().toISOString();
  const rawCat = (raw.category ?? raw.categorie ?? '').trim().toLowerCase();
  const capacity = raw.capacity ?? raw.numar_locuri ?? raw.locuri ?? 0;
  const ticketsLeft = raw.ticketsLeft ?? raw.locuri_ramase ?? capacity;
  return {
    id,
    slug: raw.slug ?? id,
    title: raw.title ?? raw.titlu ?? '',
    category: FLASK_TO_CATEGORY[rawCat] ?? 'other',
    startsAt,
    endsAt: raw.endsAt ?? startsAt,
    venue: raw.venue ?? raw.loc ?? '',
    city: raw.city ?? '',
    imageUrl: raw.imageUrl || raw.poza || '/mock/events/hero.webp',
    price: raw.price ?? { amount: 0, currency: 'RON' },
    ticketsLeft: Math.max(0, ticketsLeft),
  };
}

export interface CreateEventInput {
  title: string;
  category: EventCategory;
  description: string;
  startsAt: string;
  venue: string;
  city: string;
  capacity: number;
  imageUrl: string;
}

export const flaskEvents = {
  list: (params: { category?: EventCategory; q?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    if (params.q) search.set('q', params.q);
    const qs = search.toString();
    return request<FlaskEventItem[]>(`/events${qs ? `?${qs}` : ''}`).then((items) =>
      items.map(toEventSummary),
    );
  },

  /** POST /api/evenimente. Price, end time and per-order limit are not stored yet. */
  create: (input: CreateEventInput) =>
    request<{ id: number }>('/evenimente', {
      method: 'POST',
      body: {
        titlu: input.title,
        descriere: input.description,
        categorie: CATEGORY_TO_FLASK[input.category],
        data_ora: input.startsAt,
        loc: `${input.venue}, ${input.city}`,
        numar_locuri: input.capacity,
        ...(input.imageUrl && !input.imageUrl.startsWith('data:') ? { poza: input.imageUrl } : {}),
      },
    })
      .then((ev) => ({ id: String(ev.id) }))
      .catch(
        mapFieldErrors({
          titlu: 'title',
          descriere: 'description',
          categorie: 'category',
          data_ora: 'date',
          loc: 'venue',
          numar_locuri: 'capacity',
          locuri: 'capacity',
        }),
      ),
};

export type OrganizerRequestStatus = 'in_asteptare' | 'aprobata' | 'respinsa';

interface FlaskOrganizerRequest {
  id: number;
  organization_name: string;
  message: string | null;
  status: OrganizerRequestStatus;
  rejection_reason: string | null;
  created_at: string | null;
}

export interface OrganizerRequest {
  id: string;
  organizationName: string;
  message: string | null;
  status: OrganizerRequestStatus;
  rejectionReason: string | null;
  createdAt: string | null;
}

function toOrganizerRequest(r: FlaskOrganizerRequest): OrganizerRequest {
  return {
    id: String(r.id),
    organizationName: r.organization_name,
    message: r.message,
    status: r.status,
    rejectionReason: r.rejection_reason ?? null,
    createdAt: r.created_at,
  };
}

export const flaskOrganizerRequests = {
  mine: () =>
    request<{ cerere: FlaskOrganizerRequest | null }>('/cereri-organizator/mea').then((r) =>
      r.cerere ? toOrganizerRequest(r.cerere) : null,
    ),

  create: (input: { organizationName: string; message: string }) =>
    request<FlaskOrganizerRequest>('/cereri-organizator', {
      method: 'POST',
      body: { organization_name: input.organizationName, message: input.message },
    })
      .then(toOrganizerRequest)
      .catch(mapFieldErrors({ organization_name: 'organizationName' })),
};

interface FlaskAdminOrganizerRequest extends FlaskOrganizerRequest {
  user_name: string;
  user_email: string | null;
}

export interface AdminOrganizerRequest extends OrganizerRequest {
  userName: string;
  userEmail: string | null;
}

export const flaskAdminRequests = {
  list: (status: OrganizerRequestStatus) =>
    request<FlaskAdminOrganizerRequest[]>(
      `/admin/cereri-organizator?status=${encodeURIComponent(status)}`,
    ).then((rows) =>
      rows.map((r): AdminOrganizerRequest => ({
        ...toOrganizerRequest(r),
        userName: r.user_name,
        userEmail: r.user_email,
      })),
    ),

  pendingCount: () =>
    request<{ in_asteptare: number }>('/admin/cereri-organizator/numar').then(
      (r) => r.in_asteptare,
    ),

  approve: (id: string) =>
    request<FlaskOrganizerRequest>(`/admin/cereri-organizator/${id}/aproba`, {
      method: 'POST',
    }).then(toOrganizerRequest),

  reject: (id: string, reason: string) =>
    request<FlaskOrganizerRequest>(`/admin/cereri-organizator/${id}/respinge`, {
      method: 'POST',
      body: { motiv: reason },
    })
      .then(toOrganizerRequest)
      .catch(mapFieldErrors({ motiv: 'reason' })),
};
