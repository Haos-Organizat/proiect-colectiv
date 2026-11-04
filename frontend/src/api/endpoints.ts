import type {
  EventCategory,
  EventDetail,
  EventSummary,
  Order,
  OrganizerEvent,
  Ticket,
  User,
  UserRole,
} from '@/types/api';
import { request, USE_MOCKS } from './client';
import { flaskAuth, flaskEvents, type RegisterInput } from './flask';

/*
 * Every backend call the frontend makes. docs/api-contract.md describes each one.
 *
 * Endpoints the Flask app already implements go through the adapters in ./flask.ts
 * when VITE_USE_MOCKS is off. The rest use the contract shapes: the mock answers them
 * in mock mode, and the real server answers 404 ("not available yet") until it has them.
 */

const mockAuth = {
  me: () => request<User>('/auth/me'),
  login: (body: { email: string; password: string }) =>
    request<User>('/auth/login', { method: 'POST', body }),
  register: ({ firstName, lastName, email, password, role }: RegisterInput & { role: UserRole }) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: { name: `${firstName} ${lastName}`, email, password, university: null, role },
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

export const authApi = USE_MOCKS ? mockAuth : flaskAuth;

export const eventsApi = {
  list: (params: { category?: EventCategory; q?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    if (params.q) search.set('q', params.q);
    const qs = search.toString();
    return request<EventSummary[]>(`/events${qs ? `?${qs}` : ''}`);
  },
  get: (slug: string) => request<EventDetail>(`/events/${encodeURIComponent(slug)}`),
};

export const ordersApi = {
  create: (body: { eventId: string; quantity: number }) =>
    request<Order>('/orders', { method: 'POST', body }),
};

export const ticketsApi = {
  mine: () => request<Ticket[]>('/me/tickets'),
  get: (id: string) => request<Ticket>(`/me/tickets/${encodeURIComponent(id)}`),
};

export interface EventPayload {
  title: string;
  category: EventCategory;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  city: string;
  imageUrl: string;
  price: { amount: number; currency: 'RON' };
  capacity: number;
  maxPerOrder: number;
  status: 'draft' | 'published';
}

export const organizerApi = {
  events: () => request<OrganizerEvent[]>('/organizer/events'),
  event: (id: string) => request<OrganizerEvent>(`/organizer/events/${encodeURIComponent(id)}`),
  createEvent: (body: EventPayload): Promise<{ id: string }> =>
    USE_MOCKS
      ? request<OrganizerEvent>('/organizer/events', { method: 'POST', body })
      : flaskEvents.create(body),
  updateEvent: (id: string, body: Partial<EventPayload> | { status: 'cancelled' }) =>
    request<OrganizerEvent>(`/organizer/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
    }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>('/organizer/uploads', { method: 'POST', body: form });
  },
};
