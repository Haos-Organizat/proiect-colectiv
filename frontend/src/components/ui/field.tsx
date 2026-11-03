import { WarningCircle } from '@phosphor-icons/react';
import { use, useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { controlBase, FieldContext, useFieldControl } from './field-context';

/*
 * Compound form field. <Field> owns the ids and the error state; the control inside
 * (Input, Textarea, Select, DatePicker, TimeSelect) reads them from context, so every field gets
 * aria-invalid and aria-describedby wired the same way (brand_guidelines.md, section 7).
 *
 *   <Field error={errors.email?.message}>
 *     <FieldLabel>Email</FieldLabel>
 *     <Input type="email" {...register('email')} />
 *     <FieldHint>Use your university address.</FieldHint>
 *     <FieldError />
 *   </Field>
 */

interface FieldProps extends ComponentProps<'div'> {
  error?: string;
  /** Set when a <FieldHint> is rendered so the control is described by it. */
  hint?: boolean;
}

export function Field({ error, hint = false, className, ...props }: FieldProps) {
  const id = useId();
  return (
    <FieldContext
      value={{
        controlId: `${id}-control`,
        hintId: `${id}-hint`,
        errorId: `${id}-error`,
        error,
        hasHint: hint,
      }}
    >
      <div className={cn('grid content-start gap-1.5', className)} {...props} />
    </FieldContext>
  );
}

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  const field = use(FieldContext);
  return (
    <label
      htmlFor={field?.controlId}
      className={cn('text-[15px] font-semibold', className)}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: ComponentProps<'p'>) {
  const field = use(FieldContext);
  return (
    <p id={field?.hintId} className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  const field = use(FieldContext);
  const message = children ?? field?.error;
  if (!message) return null;
  return (
    <p
      id={field?.errorId}
      className="flex items-start gap-1.5 text-sm leading-snug font-medium text-destructive"
    >
      <WarningCircle weight="bold" aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  const control = useFieldControl();
  return <input className={cn(controlBase, className)} {...control} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const control = useFieldControl();
  return (
    <textarea
      className={cn(controlBase, 'min-h-32 py-3 leading-normal', className)}
      {...control}
      {...props}
    />
  );
}

export function Checkbox({
  className,
  children,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { children: ReactNode }) {
  const control = useFieldControl();
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-[15px]', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-[22px] shrink-0 cursor-pointer accent-primary"
        {...control}
        {...props}
      />
      <span>{children}</span>
    </label>
  );
}
