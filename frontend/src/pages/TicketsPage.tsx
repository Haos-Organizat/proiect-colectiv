import { ArrowRight, CheckCircle, Envelope } from '@phosphor-icons/react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { ticketsApi } from '@/api/endpoints';
import { ErrorState } from '@/components/PageState';
import { SkeletonGroup, TicketCardSkeleton } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';
import { TicketCard } from '@/components/TicketCard';
import { Button } from '@/components/ui/button';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice } from '@/lib/format';
import type { Order, Ticket } from '@/types/api';

export function TicketsPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;
  const justBought = params.get('order') && order?.id === params.get('order') ? order : undefined;
  const tickets = useFetch(() => ticketsApi.mine(), 'mine');

  const newIds = new Set(justBought?.tickets.map((t) => t.id));
  const upcoming = tickets.data?.filter((t) => new Date(t.event.startsAt) > new Date()) ?? [];
  const past = tickets.data?.filter((t) => new Date(t.event.startsAt) <= new Date()) ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <Seo title="My tickets" noindex />
      <p className="type-label mb-4 text-primary-text">Your account</p>
      <h1 className="type-h1 mb-8">My tickets.</h1>

      {justBought && (
        <div
          role="status"
          className="mb-8 grid gap-2 rounded-[16px] border-[1.5px] border-success bg-card p-5 motion-safe:animate-fade-in"
        >
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle weight="bold" aria-hidden className="size-5 text-success" />
            {justBought.quantity === 1
              ? 'Your ticket is ready.'
              : `Your ${justBought.quantity} tickets are ready.`}
            {justBought.total.amount > 0 && (
              <span className="font-mono">{formatPrice(justBought.total)}</span>
            )}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Envelope aria-hidden className="size-[18px]" />
            We also sent {justBought.quantity === 1 ? 'it' : 'them'} to {justBought.emailedTo}.
          </p>
        </div>
      )}

      {tickets.status === 'error' && <ErrorState error={tickets.error} onRetry={tickets.retry} />}
      {tickets.status === 'loading' && (
        <SkeletonGroup label="Loading tickets" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TicketCardSkeleton />
          <div className="hidden sm:block">
            <TicketCardSkeleton />
          </div>
        </SkeletonGroup>
      )}
      {tickets.status === 'success' && tickets.data.length === 0 && (
        <div className="grid justify-items-start gap-4 rounded-[16px] border border-border bg-card p-6">
          <p className="type-h3">No tickets yet.</p>
          <p className="text-muted-foreground">
            When you buy a ticket it shows up here with its QR code.
          </p>
          <Button asChild>
            <Link to="/events">
              Find an event <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      {upcoming.length > 0 && <TicketGrid tickets={upcoming} newIds={newIds} />}
      {past.length > 0 && (
        <section className="mt-14" aria-labelledby="past-title">
          <h2 id="past-title" className="type-h3 mb-6">
            Past events
          </h2>
          <TicketGrid tickets={past} newIds={newIds} />
        </section>
      )}
    </div>
  );
}

function TicketGrid({ tickets, newIds }: { tickets: Ticket[]; newIds: Set<string> }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tickets.map((t) => (
        <li key={t.id}>
          <TicketCard ticket={t} reveal={newIds.has(t.id)} />
        </li>
      ))}
    </ul>
  );
}
