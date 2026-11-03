import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-[26px] items-center gap-1.5 rounded-full border border-transparent px-2.5 font-mono text-xs font-medium tracking-[0.06em] whitespace-nowrap uppercase',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground',
        solid: 'bg-secondary text-secondary-foreground',
        outline: 'border-input text-foreground',
        muted: 'bg-muted text-muted-foreground',
        success: 'border-success text-success',
      },
    },
    defaultVariants: { variant: 'outline' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
