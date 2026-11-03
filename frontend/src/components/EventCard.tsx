import { MapPin } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { EventSummary } from '@/types/api';

export function EventCard({ event }: { event: EventSummary }) {
  const soldOut = event.ticketsLeft === 0;
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group grid overflow-hidden rounded-[16px] border border-border bg-card text-card-foreground transition-colors duration-150 hover:border-foreground"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={event.imageUrl}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          className="size-full object-cover"
        />
        {soldOut && (
          <Badge variant="solid" className="absolute top-3 left-3">
            Sold out
          </Badge>
        )}
      </div>
      <div className="grid gap-2 p-4">
        <p className="type-label text-primary-text">{formatDateTime(event.startsAt)}</p>
        <h3 className="type-h4 group-hover:underline">{event.title}</h3>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden className="size-[18px] shrink-0" />
            <span className="truncate">{event.venue}</span>
          </span>
          <span className="font-mono font-medium text-foreground">{formatPrice(event.price)}</span>
        </div>
      </div>
    </Link>
  );
}
