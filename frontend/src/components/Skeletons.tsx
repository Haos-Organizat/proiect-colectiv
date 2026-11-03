import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Loading placeholders shaped like the content they stand in for, so the page does not
 * jump when data arrives. The sweep animation lives in index.css (.skeleton).
 * Wrap a group in <SkeletonGroup> so screen readers hear one "Loading" instead of shapes.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

export function SkeletonGroup({
  label = 'Loading',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-[16px] border border-border bg-card">
      <Skeleton className="aspect-video rounded-none" />
      <div className="grid gap-3 p-4">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-5 w-4/5" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading events" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        // Show fewer cards on small screens so the first fold is not all placeholders.
        <div key={i} className={cn(i >= 2 && 'hidden sm:block', i >= 4 && 'sm:hidden lg:block')}>
          <EventCardSkeleton />
        </div>
      ))}
    </SkeletonGroup>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="rounded-[16px] border border-border bg-card">
      <div className="grid gap-3 p-5">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-[26px] w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mx-5 border-t-2 border-dashed border-border" />
      <div className="grid justify-items-center gap-3 p-5">
        <Skeleton className="size-[220px] rounded-[10px]" />
        <Skeleton className="h-4 w-32" />
        <div className="grid w-full grid-cols-2 gap-4">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </div>
    </div>
  );
}

export function OrganizerRowSkeleton() {
  return (
    <div className="grid gap-4 rounded-[16px] border border-border bg-card p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
      <Skeleton className="aspect-[3/2] w-full rounded-[10px] sm:w-[120px]" />
      <div className="grid gap-2.5">
        <div className="flex gap-2">
          <Skeleton className="h-[26px] w-24 rounded-full" />
          <Skeleton className="h-[26px] w-36" />
        </div>
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="flex gap-2 sm:flex-col">
        <Skeleton className="h-10 flex-1 rounded-full sm:w-24" />
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading event">
      <div className="surface-ink">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:items-end md:px-8 md:py-16">
          <div className="grid content-start gap-4">
            <Skeleton className="h-[26px] w-24 rounded-full" />
            <Skeleton className="h-10 w-4/5 md:h-14" />
            <Skeleton className="h-10 w-3/5 md:h-14" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="aspect-[3/2] w-full rounded-[16px]" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:gap-16 md:px-8 md:py-16">
        <div className="grid content-start gap-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="grid gap-2 border-t border-border pt-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
        <Skeleton className="h-72 rounded-[16px]" />
      </div>
    </SkeletonGroup>
  );
}

export function FormSkeleton() {
  return (
    <SkeletonGroup
      label="Loading"
      className="mx-auto grid max-w-[880px] gap-6 px-4 py-10 md:px-8 md:py-16"
    >
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-12 w-3/4 md:h-16" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** Generic page placeholder: used while a route's code or the session is loading. */
export function PageSkeleton() {
  return (
    <SkeletonGroup className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 md:px-8 md:py-16">
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-12 w-2/3 md:h-16" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-[16px]" />
        <Skeleton className="hidden h-64 rounded-[16px] sm:block" />
        <Skeleton className="hidden h-64 rounded-[16px] lg:block" />
      </div>
    </SkeletonGroup>
  );
}
