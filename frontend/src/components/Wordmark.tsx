import { cn } from '@/lib/utils';

/** "Uni" in primary-text, "Connect" in foreground, closed by the square ember period. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-end font-display leading-[0.85] font-black tracking-[-0.035em] [font-stretch:115%]',
        className,
      )}
    >
      <span className="text-primary-text">Uni</span>
      <span>Connect</span>
      <span aria-hidden className="mb-[0.02em] ml-[0.06em] inline-block size-[0.2em] bg-primary" />
    </span>
  );
}
