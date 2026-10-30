import { CaretDown, Check } from '@phosphor-icons/react';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/utils';
import { controlBase, panelBase, triggerBase, useFieldControl } from './field-context';

/*
 * Branded dropdown on Radix Select: keyboard, typeahead and screen reader support come
 * from Radix. Use inside <Field> like any input:
 *
 *   <Controller control={control} name="category" render={({ field }) => (
 *     <Select value={field.value} onValueChange={field.onChange} onBlur={field.onBlur}
 *             placeholder="Choose a category">
 *       <SelectItem value="party">Parties</SelectItem>
 *     </Select>
 *   )} />
 */

interface SelectProps {
  ref?: Ref<HTMLButtonElement>;
  value?: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  /** With no value yet, open the list scrolled to (and focused on) this item. */
  initialValue?: string;
  className?: string;
  children: ReactNode;
}

export function Select({
  ref,
  value,
  onValueChange,
  onBlur,
  placeholder,
  disabled,
  name,
  initialValue,
  className,
  children,
}: SelectProps) {
  const control = useFieldControl();

  // Runs when the list mounts. Waits a frame so Radix has done its own initial focus.
  const startAtInitial = (viewport: HTMLDivElement | null) => {
    if (!viewport || value || !initialValue) return;
    requestAnimationFrame(() => {
      const item = viewport.querySelector<HTMLElement>(`[data-value="${initialValue}"]`);
      if (!item) return;
      viewport.scrollTop = item.offsetTop - viewport.clientHeight / 3;
      item.focus();
    });
  };

  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      // Validate on close, like a text field validates on blur. Deferred so a value picked
      // in the same interaction is stored before validation reads it.
      onOpenChange={(open) => {
        if (!open) setTimeout(() => onBlur?.(), 0);
      }}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        {...control}
        className={cn(
          controlBase,
          triggerBase,
          'data-[placeholder]:text-muted-foreground',
          className,
        )}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <CaretDown weight="bold" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            panelBase,
            'max-h-[min(320px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-40 overflow-hidden',
          )}
        >
          <SelectPrimitive.Viewport ref={startAtInitial} className="p-1.5">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <SelectPrimitive.Item
      value={value}
      data-value={value}
      className="relative flex min-h-11 cursor-pointer items-center rounded-[10px] py-2 pr-10 pl-3 text-base outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:font-semibold"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex">
        <Check weight="bold" aria-hidden className="size-[18px] text-primary-text" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
