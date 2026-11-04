import { ArrowSquareOut, CheckCircle, PencilSimple, Plus } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router';
import { organizerApi } from '@/api/endpoints';
import { ErrorState } from '@/components/PageState';
import { OrganizerRowSkeleton, SkeletonGroup } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFetch } from '@/hooks/useFetch';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { EventStatus, OrganizerEvent } from '@/types/api';

const STATUS: Record<EventStatus, { label: string; variant: 'success' | 'muted' | 'outline' }> = {
  published: { label: 'Published', variant: 'success' },
  draft: { label: 'Draft', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
};

export function OrganizerDashboardPage() {
  const events = useFetch(() => organizerApi.events(), 'organizer-events');
  const saved = (useLocation().state as { saved?: string } | null)?.saved;

  const totals = events.data?.reduce(
    (acc, e) => ({
      sold: acc.sold + e.ticketsSold,
      revenue: acc.revenue + e.revenue.amount,
      live: acc.live + (e.status === 'published' ? 1 : 0),
    }),
    { sold: 0, revenue: 0, live: 0 },
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-4">
          <Seo title="Organizer dashboard" noindex />
          <p className="type-label text-primary-text">Organizer</p>
          <h1 className="type-h1">Your events.</h1>
        </div>
        <Button asChild>
          <Link to="/organizer/events/new">
            <Plus /> Create event
          </Link>
        </Button>
      </div>

      {saved && (
        <p
          role="status"
          className="mb-8 flex items-center gap-2 rounded-[16px] border-[1.5px] border-success bg-card p-5 font-semibold motion-safe:animate-fade-in"
        >
          <CheckCircle weight="bold" aria-hidden className="size-5 shrink-0 text-success" />
          Saved "{saved}".
        </p>
      )}

      {totals && (
        <dl className="mb-10 grid grid-cols-3 border-y border-border">
          <Stat label="Published" value={String(totals.live)} />
          <Stat label="Tickets sold" value={totals.sold.toLocaleString('en-GB')} />
          <Stat
            label="Revenue"
            value={formatPrice({ amount: totals.revenue, currency: 'RON' }).replace(
              'Free',
              '0 RON',
            )}
          />
        </dl>
      )}

      {events.status === 'error' && <ErrorState error={events.error} onRetry={events.retry} />}
      {events.status === 'loading' && (
        <SkeletonGroup label="Loading your events" className="grid gap-3">
          <OrganizerRowSkeleton />
          <OrganizerRowSkeleton />
          <OrganizerRowSkeleton />
        </SkeletonGroup>
      )}
      {events.status === 'success' && events.data.length === 0 && (
        <div className="grid justify-items-start gap-4 rounded-[16px] border border-border bg-card p-6">
          <p className="type-h3">No events yet.</p>
          <p className="text-muted-foreground">
            Create your first event. You can save it as a draft and publish later.
          </p>
        </div>
      )}
      {events.status === 'success' && events.data.length > 0 && (
        <ul className="grid gap-3">
          {events.data.map((e) => (
            <li key={e.id}>
              <EventRow event={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-r border-border py-5 pr-3 last:border-r-0 [&:not(:first-child)]:pl-3 md:[&:not(:first-child)]:pl-6">
      <dt className="type-label text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl font-black md:text-4xl">{value}</dd>
    </div>
  );
}

function EventRow({ event: e }: { event: OrganizerEvent }) {
  const pct = Math.round((e.ticketsSold / e.capacity) * 100);
  const status = STATUS[e.status];
  return (
    <article className="grid gap-4 rounded-[16px] border border-border bg-card p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
      <img
        src={e.imageUrl}
        alt=""
        width={240}
        height={160}
        loading="lazy"
        className="aspect-[3/2] w-full rounded-[10px] object-cover sm:w-[120px]"
      />
      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="font-mono text-sm text-primary-text">{formatDateTime(e.startsAt)}</span>
        </div>
        <h2 className="type-h4 truncate">{e.title}</h2>
        <div className="grid gap-1.5">
          <p className="flex justify-between gap-3 font-mono text-sm">
            <span>
              {e.ticketsSold} / {e.capacity} sold
            </span>
            <span className="text-muted-foreground">{formatPrice(e.price)} each</span>
          </p>
          {/* Static progress bar: sold share of capacity */}
          <div
            role="progressbar"
            aria-label={`${pct}% sold`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:flex-col">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link to={`/organizer/events/${e.id}/edit`}>
            <PencilSimple /> Edit
          </Link>
        </Button>
        {e.status === 'published' && (
          <Button variant="ghost" size="sm" asChild className="flex-1">
            <Link to={`/events/${e.slug}`}>
              <ArrowSquareOut /> View
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
