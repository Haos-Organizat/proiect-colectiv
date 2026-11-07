/*
 * Shapes exchanged with the backend. docs/api-contract.md documents every endpoint
 * that returns or accepts these; keep the two in sync.
 *
 * Conventions: ids are strings, dates are ISO 8601 with timezone offset,
 * money is an integer in minor units (bani) plus an ISO 4217 currency code.
 */

export type UserRole = 'student' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  university: string | null;
}

export const EVENT_CATEGORIES = [
  'party',
  'concert',
  'tech',
  'career',
  'culture',
  'sport',
  'workshop',
  'volunteering',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface Money {
  /** Integer in minor units: 4500 means 45.00. */
  amount: number;
  currency: 'RON';
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  venue: string;
  city: string;
  imageUrl: string;
  price: Money;
  /** Seats still available. 0 means sold out. */
  ticketsLeft: number;
}

export interface EventDetail extends EventSummary {
  description: string;
  organizer: { id: string; name: string };
  capacity: number;
  /** Max tickets one user can buy in a single order. */
  maxPerOrder: number;
}

export type TicketStatus = 'valid' | 'used' | 'cancelled';

export interface Ticket {
  id: string;
  /** Human readable code, shown under the QR for manual check-in. */
  code: string;
  /** Opaque, signed string the QR encodes. The door scanner sends it back to the API. */
  qrPayload: string;
  status: TicketStatus;
  holderName: string;
  purchasedAt: string;
  event: Pick<EventSummary, 'id' | 'slug' | 'title' | 'startsAt' | 'venue' | 'city' | 'imageUrl'>;
}

export interface Order {
  id: string;
  eventId: string;
  quantity: number;
  total: Money;
  tickets: Ticket[];
  /** Address the tickets were emailed to. */
  emailedTo: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface OrganizerEvent extends EventDetail {
  status: EventStatus;
  ticketsSold: number;
  revenue: Money;
}

export interface ApiErrorBody {
  error: {
    /** Stable machine code, e.g. "invalid_credentials", "sold_out". */
    code: string;
    message: string;
    /** Per-field messages for 422 validation errors, keyed by request field name. */
    fields?: Record<string, string>;
  };
}
