import type { Ref } from 'react';
import { Select, SelectItem } from './select';

/** Every 15 minutes, "00:00" to "23:45". */
const SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

interface TimeSelectProps {
  ref?: Ref<HTMLButtonElement>;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Time picker as a branded dropdown in 15 minute steps. Value is "HH:MM" or "". */
export function TimeSelect({
  ref,
  value,
  onChange,
  onBlur,
  placeholder = 'Pick a time',
  disabled,
}: TimeSelectProps) {
  // Keep an existing off-grid time (e.g. 19:10 from older data) selectable.
  const slots = value && !SLOTS.includes(value) ? [...SLOTS, value].sort() : SLOTS;
  return (
    <Select
      ref={ref}
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      initialValue="18:00"
      className="font-mono data-[placeholder]:font-sans"
    >
      {slots.map((t) => (
        <SelectItem key={t} value={t}>
          <span className="font-mono data-[placeholder]:font-sans">{t}</span>
        </SelectItem>
      ))}
    </Select>
  );
}
