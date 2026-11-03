import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Popover } from 'radix-ui';
import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { controlBase, panelBase, triggerBase, useFieldControl } from './field-context';

/*
 * Custom date picker: a field-styled button that opens a month calendar in a popover.
 * Value is a local date string "YYYY-MM-DD" (or "" when empty), same as <input type="date">.
 * Keyboard: arrows move by day/week, PageUp/PageDown by month, Home/End to week edges,
 * Enter/Space picks, Escape closes.
 */

const LOCALE = 'en-GB';
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay));
}

/** 6 weeks starting on the Monday on or before the 1st of the month. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

interface DatePickerProps {
  ref?: Ref<HTMLButtonElement>;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Earliest selectable day, "YYYY-MM-DD". */
  min?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  ref,
  value,
  onChange,
  onBlur,
  min,
  placeholder = 'Pick a date',
  disabled,
}: DatePickerProps) {
  const control = useFieldControl();
  const [open, setOpen] = useState(false);

  const label = value
    ? new Intl.DateTimeFormat(LOCALE, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(fromKey(value))
    : placeholder;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <Popover.Trigger asChild disabled={disabled}>
        <button
          ref={ref}
          type="button"
          {...control}
          className={cn(controlBase, triggerBase, !value && 'text-muted-foreground')}
        >
          <span className="truncate">{label}</span>
          <CalendarBlank aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={16}
          // Focus the selected (or today's) day instead of the first button in the panel.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement)
              .querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')
              ?.focus();
          }}
          className={cn(panelBase, 'w-[320px] max-w-[calc(100vw-32px)] p-3')}
        >
          <Calendar
            value={value}
            min={min}
            onSelect={(key) => {
              onChange(key);
              setOpen(false);
              onBlur?.();
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Calendar({
  value,
  min,
  onSelect,
}: {
  value: string;
  min?: string;
  onSelect: (key: string) => void;
}) {
  const todayKey = toKey(new Date());
  const [focused, setFocused] = useState(() =>
    fromKey(value || (min && min > todayKey ? min : todayKey)),
  );
  const [month, setMonth] = useState(() => new Date(focused.getFullYear(), focused.getMonth(), 1));
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const days = monthGrid(month);
  const isDisabled = (d: Date) => Boolean(min && toKey(d) < min);
  const canGoBack = !min || toKey(new Date(month.getFullYear(), month.getMonth(), 0)) >= min;

  // After keyboard navigation, move DOM focus to the newly focused day.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toKey(focused)}"]`)?.focus();
  }, [focused]);

  const go = (next: Date) => {
    moveFocus.current = true;
    setFocused(next);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(month, delta);
    setMonth(next);
    setFocused(addMonths(focused, delta));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
      Home: () => addDays(focused, -((focused.getDay() + 6) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() + 6) % 7)),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const next = move();
    if (!isDisabled(next)) go(next);
  };

  const monthLabel = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(
    month,
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
        >
          <CaretLeft />
        </Button>
        <p aria-live="polite" className="type-h4">
          {monthLabel}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          <CaretRight />
        </Button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={monthLabel}
        onKeyDown={onKeyDown}
        className="grid gap-1"
      >
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              role="columnheader"
              className="type-label py-1 text-center text-muted-foreground"
            >
              {d}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div key={week} role="row" className="grid grid-cols-7 gap-1">
            {days.slice(week * 7, week * 7 + 7).map((d) => {
              const key = toKey(d);
              const selected = key === value;
              const outside = d.getMonth() !== month.getMonth();
              const disabled = isDisabled(d);
              const isFocused = key === toKey(focused);
              return (
                <span key={key} role="gridcell" aria-selected={selected}>
                  <button
                    type="button"
                    data-day={key}
                    tabIndex={isFocused ? 0 : -1}
                    disabled={disabled}
                    onClick={() => onSelect(key)}
                    onFocus={() => setFocused(d)}
                    aria-label={new Intl.DateTimeFormat(LOCALE, { dateStyle: 'full' }).format(d)}
                    aria-current={key === todayKey ? 'date' : undefined}
                    className={cn(
                      'flex aspect-square w-full items-center justify-center rounded-full font-mono text-[15px] transition-colors duration-150',
                      'hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                      outside && 'text-muted-foreground',
                      key === todayKey &&
                        !selected &&
                        'font-semibold text-primary-text underline underline-offset-4',
                      selected &&
                        'bg-primary font-semibold text-primary-foreground hover:bg-primary-hover',
                      disabled && 'cursor-not-allowed opacity-35 hover:bg-transparent',
                    )}
                  >
                    {d.getDate()}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
