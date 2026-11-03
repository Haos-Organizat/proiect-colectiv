import { CalendarBlank, MapPin } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/types/api';

const STATUS_LABEL: Record<Ticket['status'], string> = {
  valid: 'Valid',
  used: 'Checked in',
  cancelled: 'Cancelled',
};

/**
 * Full ticket with QR. The QR is always black on white, in both themes, so door
 * scanners read it (brand_guidelines.md, section 8). `reveal` plays the one-time
 * ticket-in animation used right after a purchase.
 */
export function TicketCard({ ticket, reveal = false }: { ticket: Ticket; reveal?: boolean }) {
  return (
    <article
      className={cn(
        'relative rounded-[16px] border border-border bg-card text-card-foreground',
        reveal && 'motion-safe:animate-ticket-in',
      )}
    >
      <header className="grid gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="type-h4">{ticket.event.title}</h3>
          <Badge variant={ticket.status === 'valid' ? 'success' : 'muted'}>
            {STATUS_LABEL[ticket.status]}
          </Badge>
        </div>
        <p className="flex items-center gap-1.5 font-mono text-sm font-medium text-primary-text">
          <CalendarBlank aria-hidden className="size-4" />
          {formatDateTime(ticket.event.startsAt)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-4" />
          {ticket.event.venue}, {ticket.event.city}
        </p>
      </header>

      {/* Tear line with half-circle notches */}
      <div aria-hidden className="relative mx-5 border-t-2 border-dashed border-border">
        <span className="absolute -top-[12px] -left-[31px] size-[22px] rounded-full border border-border bg-background [clip-path:inset(0_0_0_50%)]" />
        <span className="absolute -top-[12px] -right-[31px] size-[22px] rounded-full border border-border bg-background [clip-path:inset(0_50%_0_0)]" />
      </div>

      <div className="grid justify-items-center gap-3 p-5">
        <div
          className={cn('rounded-[10px] bg-white p-3', ticket.status !== 'valid' && 'opacity-40')}
        >
          <QRCodeSVG
            value={ticket.qrPayload}
            size={196}
            level="M"
            bgColor="#ffffff"
            fgColor="#0b0a09"
            title={`QR code for ticket ${ticket.code}`}
          />
        </div>
        <p className="font-mono text-base font-semibold tracking-[0.1em]">{ticket.code}</p>
        <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="grid gap-0.5">
            <dt className="type-label text-muted-foreground">Holder</dt>
            <dd className="font-medium">{ticket.holderName}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="type-label text-muted-foreground">Bought</dt>
            <dd className="font-mono font-medium">{formatDateTime(ticket.purchasedAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
