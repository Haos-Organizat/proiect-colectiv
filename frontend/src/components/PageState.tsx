import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import type { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';

export function LoadingText({ children = 'Loading' }: { children?: ReactNode }) {
  return (
    <p role="status" className="type-label text-muted-foreground">
      {children}
    </p>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="grid justify-items-start gap-4 rounded-[16px] border border-border bg-card p-6"
    >
      <p className="flex items-center gap-2 font-semibold">
        <WarningCircle weight="bold" aria-hidden className="size-5 text-destructive" />
        {error.message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <ArrowClockwise /> Try again
        </Button>
      )}
    </div>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[12px] border-[1.5px] border-destructive bg-card p-3 text-sm font-medium text-destructive"
    >
      <WarningCircle weight="bold" aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
