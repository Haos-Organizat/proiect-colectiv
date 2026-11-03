import { createContext, use } from 'react';

/*
 * Shared by <Field> and every control that can sit inside it (Input, Textarea, Select,
 * DatePicker, ...). Lives in its own file so component files only export components.
 */

export interface FieldContextValue {
  controlId: string;
  hintId: string;
  errorId: string;
  error?: string;
  hasHint: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/** id, aria-invalid and aria-describedby for the control inside the nearest <Field>. */
export function useFieldControl() {
  const field = use(FieldContext);
  if (!field) return {};
  const describedBy = [field.hasHint && field.hintId, field.error && field.errorId]
    .filter(Boolean)
    .join(' ');
  return {
    id: field.controlId,
    'aria-invalid': field.error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const;
}

/** Box styles shared by every text-like control, so they all line up at 48px. */
export const controlBase =
  'w-full min-h-12 rounded-[12px] border-[1.5px] border-input bg-card px-3.5 text-base text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus:border-ring focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_28%,transparent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_28%,transparent)]';

/** Extra styles for button-based controls (Select, DatePicker) that open a popover. */
export const triggerBase =
  'flex cursor-pointer items-center justify-between gap-2 text-left data-[state=open]:border-ring data-[state=open]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_28%,transparent)] [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-muted-foreground';

/** Floating panel for popovers and dropdown lists. No open/close animation (brand rule). */
export const panelBase =
  'z-50 rounded-[16px] border border-border bg-popover text-popover-foreground shadow-[0_10px_30px_-10px_rgb(0_0_0/0.35)]';
