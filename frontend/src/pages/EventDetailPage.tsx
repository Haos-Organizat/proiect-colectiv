import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarBlank, Clock, MapPin, Minus, Plus, Ticket, Users } from '@phosphor-icons/react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { eventsApi, ordersApi } from '@/api/endpoints';
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
import type { EventDetail } from '@/types/api';
import { orderSchema, type OrderInput } from '@/types/schemas';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const event = useFetch(() => eventsApi.get(slug), slug);

  if (event.status === 'loading') return <EventDetailSkeleton />;
  if (event.status === 'error') {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
        <Seo title="Event not found" noindex />
        <ErrorState
          error={event.error}
          onRetry={event.error.status === 404 ? undefined : event.retry}
        />
      </div>
    );
  }

  const e = event.data;
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
              {e.ticketsLeft === 0 && <Badge variant="solid">Sold out</Badge>}
            </p>
            <h1 className="type-h1">{e.title}</h1>
            <p className="text-muted-foreground">by {e.organizer.name}</p>
          </div>
          <img
            src={e.imageUrl}
            alt=""
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
            <Fact
              icon={Clock}
              label="Time"
              value={`${formatTime(e.startsAt)} to ${formatTime(e.endsAt)}`}
            />
            <Fact icon={MapPin} label="Venue" value={`${e.venue}, ${e.city}`} />
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
function EventJsonLd({ event: e }: { event: EventDetail }) {
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

function PurchaseCard({ event }: { event: EventDetail }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const max = Math.min(event.maxPerOrder, event.ticketsLeft);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema(event.maxPerOrder, event.ticketsLeft)),
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

  if (event.ticketsLeft === 0) {
    return (
      <div className={shell}>
        <p className="type-h3">Sold out</p>
        <p className="text-muted-foreground">
          All {event.capacity} tickets are gone. Check other events this week.
        </p>
        <Button variant="outline" asChild>
          <Link to="/events">Browse events</Link>
        </Button>
      </div>
    );
  }

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
            <Ticket /> Log in to buy
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
            ? 'Get free tickets'
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
