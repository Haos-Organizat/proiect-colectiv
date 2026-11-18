import { zodResolver } from '@hookform/resolvers/zod';
import {
  Buildings,
  CalendarBlank,
  CheckCircle,
  Clock,
  MapPin,
  Minus,
  Plus,
  Ticket,
  Users,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { eventsApi, ordersApi, ticketsApi } from '@/api/endpoints';
import { ErrorState, FormAlert } from '@/components/PageState';
import { Seo } from '@/components/Seo';
import { EventDetailSkeleton } from '@/components/Skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel, Input } from '@/components/ui/field';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import {
  CATEGORY_LABELS,
  formatDay,
  formatDayShort,
  formatPrice,
  formatTime,
  snippet,
} from '@/lib/format';
import {
  EVENT_CATEGORIES,
  type EventCategory,
  type EventDetail,
  type EventStatus,
  type Ticket as UserTicket,
} from '@/types/api';
import { orderSchema, type OrderInput } from '@/types/schemas';

const FLASK_TO_CATEGORY: Record<string, EventCategory> = {
  petrecere: 'party',
  petreceri: 'party',
  muzica: 'concert',
  muzică: 'concert',
  tehnologie: 'tech',
  it: 'tech',
  academic: 'education',
  academice: 'education',
  conferinta: 'education',
  conferință: 'education',
  cariera: 'career',
  carieră: 'career',
  cultura: 'culture',
  cultură: 'culture',
  cultural: 'culture',
  arta: 'culture',
  artă: 'culture',
  social: 'other',
  sociale: 'other',
  sport: 'sport',
  workshop: 'workshop',
  educatie: 'education',
  educație: 'education',
  voluntariat: 'volunteering',
  altele: 'other',
};

interface FlaskInscriere {
  id?: number | string;
  user_id?: number | string;
  utilizator_id?: number | string;
  status?: string;
}

interface RawEventResponse {
  id?: string | number;
  slug?: string;
  title?: string;
  titlu?: string;
  description?: string;
  descriere?: string;
  category?: string;
  categorie?: string;
  startsAt?: string;
  data_ora?: string;
  endsAt?: string;
  data_sfarsit?: string;
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
  maxPerOrder?: number;
  organizer?: { id: string; name: string };
  organizatie?: string;
  organizatie_id?: number | string | null;
  creator_id?: number | string | null;
  status?: EventStatus | 'activ' | 'anulat' | 'inactiv';
  isRegistered?: boolean;
  este_inscris?: boolean;
  userTicketId?: string | null;
  bilet_id?: number | string | null;
  inscrieri?: FlaskInscriere[];
}

export interface EventDetailView extends EventDetail {
  status: EventStatus | 'activ' | 'anulat' | 'inactiv';
  isRegistered: boolean;
  userTicketId: string | null;
}

function toCategory(raw?: string): EventCategory {
  if (!raw) return 'culture';
  const normalized = raw.trim().toLowerCase();
  if ((EVENT_CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as EventCategory;
  }
  return FLASK_TO_CATEGORY[normalized] ?? 'culture';
}

function normalizeEventDetail(raw: RawEventResponse, currentUserId?: string): EventDetailView {
  const id = String(raw.id ?? '');
  const title = raw.title ?? raw.titlu ?? '';
  const description = raw.description ?? raw.descriere ?? '';
  const category = toCategory(raw.category ?? raw.categorie);
  const startsAt = raw.startsAt ?? raw.data_ora ?? new Date().toISOString();
  const endsAt = raw.endsAt ?? raw.data_sfarsit ?? startsAt;
  const venue = raw.venue ?? raw.loc ?? '';
  const city = raw.city ?? '';
  const imageUrl = raw.imageUrl || raw.poza || '/mock/events/hero.webp';
  const price = raw.price ?? { amount: 0, currency: 'RON' as const };
  const capacity = raw.capacity ?? raw.numar_locuri ?? raw.locuri ?? 0;

  // Remaining seats are calculated only from registrations with status "activa"
  const activeInscrieri = Array.isArray(raw.inscrieri)
    ? raw.inscrieri.filter(
        (i) =>
          String(i.status ?? '')
            .trim()
            .toLowerCase() === 'activa',
      )
    : null;

  const ticketsLeft =
    raw.ticketsLeft ??
    raw.locuri_ramase ??
    (activeInscrieri !== null ? Math.max(0, capacity - activeInscrieri.length) : capacity);

  const organizerName = raw.organizer?.name ?? raw.organizatie ?? 'Student Organization';
  const organizerId = String(raw.organizer?.id ?? raw.organizatie_id ?? raw.creator_id ?? '');

  let isRegistered = Boolean(raw.isRegistered ?? raw.este_inscris);
  let userTicketId =
    raw.userTicketId != null
      ? String(raw.userTicketId)
      : raw.bilet_id != null
        ? String(raw.bilet_id)
        : null;

  if (!isRegistered && currentUserId && activeInscrieri) {
    const match = activeInscrieri.find(
      (i) => String(i.user_id ?? i.utilizator_id ?? '') === String(currentUserId),
    );
    if (match) {
      isRegistered = true;
      userTicketId = match.id != null ? String(match.id) : null;
    }
  }

  return {
    id,
    slug: raw.slug ?? id,
    title,
    category,
    startsAt,
    endsAt,
    venue,
    city,
    imageUrl,
    price,
    capacity,
    ticketsLeft: Math.max(0, ticketsLeft),
    maxPerOrder: raw.maxPerOrder ?? 1,
    description,
    organizer: { id: organizerId, name: organizerName },
    status: raw.status ?? 'published',
    isRegistered,
    userTicketId,
  };
}

function formatLocation(venue: string, city: string): string {
  if (!city || venue.toLowerCase().includes(city.toLowerCase())) {
    return venue;
  }
  return `${venue}, ${city}`;
}

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const event = useFetch(() => eventsApi.get(slug) as Promise<RawEventResponse>, slug);

  if (event.status === 'loading') return <EventDetailSkeleton />;
  if (event.status === 'error') {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
        <Seo title="Event not found" noindex />
        {event.error.status === 404 && <p className="type-label mb-3 text-primary-text">404</p>}
        <ErrorState
          error={event.error}
          onRetry={event.error.status === 404 ? undefined : event.retry}
        />
      </div>
    );
  }

  const e = normalizeEventDetail(event.data, user?.id);
  const isCancelled = e.status === 'cancelled' || e.status === 'anulat' || e.status === 'inactiv';
  const locationLabel = formatLocation(e.venue, e.city);
  const timeRange =
    e.endsAt && e.endsAt !== e.startsAt
      ? `${formatTime(e.startsAt)} to ${formatTime(e.endsAt)}`
      : formatTime(e.startsAt);

  return (
    <article>
      <Seo
        title={`${e.title}, ${formatDayShort(e.startsAt)}`}
        description={snippet(e.description)}
        image={e.imageUrl}
        type="article"
      />
      <EventJsonLd event={e} />
      <div className="surface-ink">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:items-end md:px-8 md:py-16">
          <div className="grid content-start gap-4">
            <p className="flex flex-wrap gap-2">
              <Badge variant="primary">{CATEGORY_LABELS[e.category]}</Badge>
              {isCancelled && <Badge variant="muted">Cancelled</Badge>}
              {!isCancelled && e.ticketsLeft === 0 && <Badge variant="solid">Sold out</Badge>}
            </p>
            <h1 className="type-h1">{e.title}</h1>
            <p className="text-muted-foreground">by {e.organizer.name}</p>
          </div>
          <img
            src={e.imageUrl}
            alt={e.title}
            width={1200}
            height={800}
            className="aspect-[3/2] w-full rounded-[16px] object-cover"
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:gap-16 md:px-8 md:py-16">
        <div className="grid content-start gap-8">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact icon={CalendarBlank} label="Date" value={formatDay(e.startsAt)} />
            <Fact icon={Clock} label="Time" value={timeRange} />
            <Fact icon={MapPin} label="Venue" value={locationLabel} />
            <Fact icon={Buildings} label="Organizer" value={e.organizer.name} />
            <Fact icon={Users} label="Seats left" value={`${e.ticketsLeft} of ${e.capacity}`} />
          </dl>
          <div className="grid gap-3">
            <h2 className="type-h3">About this event</h2>
            <p className="max-w-[60ch] text-lg whitespace-pre-line">{e.description}</p>
          </div>
        </div>
        <aside className="md:sticky md:top-24 md:self-start">
          <PurchaseCard event={e} />
        </aside>
      </div>
    </article>
  );
}

/** schema.org Event data so search engines can show date, place and price. */
function EventJsonLd({ event: e }: { event: EventDetailView }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: e.description,
    startDate: e.startsAt,
    endDate: e.endsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: e.imageUrl.startsWith('data:') ? undefined : [new URL(e.imageUrl, location.origin).href],
    location: {
      '@type': 'Place',
      name: e.venue,
      address: { '@type': 'PostalAddress', addressLocality: e.city, addressCountry: 'RO' },
    },
    organizer: { '@type': 'Organization', name: e.organizer.name },
    offers: {
      '@type': 'Offer',
      url: `${location.origin}/events/${e.slug}`,
      price: (e.price.amount / 100).toFixed(2),
      priceCurrency: e.price.currency,
      availability: e.ticketsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here once "<" is escaped, so it cannot close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-border pt-3">
      <dt className="type-label flex items-center gap-1.5 text-muted-foreground">
        <Icon aria-hidden className="size-4" />
        {label}
      </dt>
      <dd className="font-mono font-medium">{value}</dd>
    </div>
  );
}

function PurchaseCard({ event }: { event: EventDetailView }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [matchedTicket, setMatchedTicket] = useState<UserTicket | null>(null);
  const max = Math.max(1, Math.min(event.maxPerOrder, Math.max(1, event.ticketsLeft)));

  useEffect(() => {
    if (!user || event.isRegistered) {
      return;
    }
    let active = true;
    ticketsApi
      .mine()
      .then((tickets) => {
        if (!active) return;
        const found = tickets.find(
          (t) =>
            (t.event.id === event.id || t.event.slug === event.slug) &&
            (t.status === 'valid' || (t.status as string) === 'activa'),
        );
        if (found) setMatchedTicket(found);
      })
      .catch(() => {
        // Tickets endpoint may not be available yet; ignore.
      });
    return () => {
      active = false;
    };
  }, [user, event.id, event.slug, event.isRegistered]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema(event.maxPerOrder, Math.max(1, event.ticketsLeft))),
    defaultValues: { quantity: 1 },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const quantity = useWatch({ control, name: 'quantity' });
  const validQty = Number.isInteger(quantity) && quantity > 0 && quantity <= max ? quantity : 0;
  const total = { ...event.price, amount: event.price.amount * validQty };
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(1, (validQty || 1) + delta));
    setValue('quantity', next, { shouldValidate: true });
  };

  const onSubmit = async ({ quantity }: OrderInput) => {
    setServerError(null);
    try {
      const order = await ordersApi.create({ eventId: event.id, quantity });
      navigate(`/account/tickets?order=${order.id}`, { state: { order } });
    } catch (err) {
      if (err instanceof ApiError && err.fields.quantity) {
        setError('quantity', { message: err.fields.quantity }, { shouldFocus: true });
      } else {
        setServerError(err instanceof ApiError ? err.message : 'Could not complete the order.');
      }
    }
  };

  const shell = 'grid gap-5 rounded-[16px] border border-border bg-card p-5 text-card-foreground';

  const isCancelled =
    event.status === 'cancelled' || event.status === 'anulat' || event.status === 'inactiv';
  const isPast = new Date(event.startsAt) <= new Date();
  const isRegistered = Boolean(user && (event.isRegistered || matchedTicket !== null));
  const ticketId = event.userTicketId ?? matchedTicket?.id ?? null;
  const ticketHref = ticketId
    ? `/account/tickets?ticket=${encodeURIComponent(ticketId)}`
    : '/account/tickets';

  // 1. Past or cancelled event: disabled button
  if (isCancelled || isPast) {
    return (
      <div className={shell}>
        <p className="type-h3">{isCancelled ? 'Event cancelled' : 'Event ended'}</p>
        <p className="text-muted-foreground">
          {isCancelled
            ? 'This event has been cancelled. Registration is no longer available.'
            : 'This event has already taken place. Registration is closed.'}
        </p>
        <Button type="button" disabled>
          <Ticket /> {isCancelled ? 'Event cancelled' : 'Event ended'}
        </Button>
        {isRegistered && (
          <Button variant="outline" asChild>
            <Link to={ticketHref}>View ticket</Link>
          </Button>
        )}
      </div>
    );
  }

  // 2. Already registered: status button and link to ticket
  if (isRegistered) {
    return (
      <div className={shell}>
        <p className="type-h3">You're registered</p>
        <p className="text-muted-foreground">Your spot for this event is confirmed.</p>
        <Button type="button" disabled>
          <CheckCircle weight="bold" /> You're registered
        </Button>
        <Button variant="outline" asChild>
          <Link to={ticketHref}>
            <Ticket /> View ticket
          </Link>
        </Button>
      </div>
    );
  }

  // 3. Full event: Sold out
  if (event.ticketsLeft === 0) {
    return (
      <div className={shell}>
        <p className="type-h3">Sold out</p>
        <p className="text-muted-foreground">
          All {event.capacity} tickets are gone. Check other events this week.
        </p>
        <Button type="button" disabled>
          <Ticket /> Sold out
        </Button>
        <Button variant="outline" asChild>
          <Link to="/events">Browse events</Link>
        </Button>
      </div>
    );
  }

  // 4. Unauthenticated: Log in to register / buy
  if (!user) {
    return (
      <div className={shell}>
        <div className="flex items-baseline justify-between">
          <p className="type-label text-muted-foreground">Price per ticket</p>
          <p className="font-mono text-xl font-semibold">{formatPrice(event.price)}</p>
        </div>
        <p className="text-muted-foreground">
          Log in to buy tickets. They land in your account and inbox.
        </p>
        <Button asChild>
          <Link to="/login" state={{ from: location.pathname }}>
            <Ticket /> Log in to register
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/register" state={{ from: location.pathname }}>
            Create an account
          </Link>
        </Button>
      </div>
    );
  }

  // 5. Authenticated, not registered, seats available
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className={shell}>
      <div className="flex items-baseline justify-between">
        <p className="type-label text-muted-foreground">Price per ticket</p>
        <p className="font-mono text-xl font-semibold">{formatPrice(event.price)}</p>
      </div>

      <Field error={errors.quantity?.message}>
        <FieldLabel>How many tickets</FieldLabel>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12"
            onClick={() => step(-1)}
            aria-label="One less"
            disabled={validQty <= 1}
          >
            <Minus />
          </Button>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            className="text-center font-mono"
            {...register('quantity', { valueAsNumber: true })}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12"
            onClick={() => step(1)}
            aria-label="One more"
            disabled={validQty >= max}
          >
            <Plus />
          </Button>
        </div>
        <FieldError />
      </Field>

      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <p className="font-semibold">Total</p>
        <p className="font-mono text-2xl font-semibold">
          {validQty === 0 ? '-' : formatPrice(total)}
        </p>
      </div>

      {serverError && <FormAlert>{serverError}</FormAlert>}

      <Button type="submit" disabled={isSubmitting}>
        <Ticket />{' '}
        {isSubmitting
          ? 'Placing order'
          : event.price.amount === 0
            ? 'Register'
            : validQty === 0
              ? 'Pay'
              : `Pay ${formatPrice(total)}`}
      </Button>
      <p className="text-sm text-muted-foreground">
        Tickets are sent to <span className="font-semibold text-foreground">{user.email}</span> and
        saved in My tickets.
      </p>
    </form>
  );
}
