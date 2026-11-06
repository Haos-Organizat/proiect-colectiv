import type { EventCategory, User } from '@/types/api';
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

/** Frontend category -> value accepted by the backend validator (CATEGORII_PERMISE). */
const CATEGORY_TO_FLASK: Record<EventCategory, string> = {
  party: 'petrecere',
  concert: 'muzica',
  tech: 'tehnologie',
  career: 'cariera',
  culture: 'cultura',
  sport: 'sport',
  workshop: 'workshop',
  volunteering: 'voluntariat',
};

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
