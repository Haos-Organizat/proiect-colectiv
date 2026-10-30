import type { EventCategory, Money } from '@/types/api';

const LOCALE = 'en-GB';
const TIME_ZONE = 'Europe/Bucharest';

/** "45 RON", "Free" for zero. */
export function formatPrice({ amount, currency }: Money) {
  if (amount === 0) return 'Free';
  const value = (amount / 100).toLocaleString(LOCALE, { maximumFractionDigits: 2 });
  return `${value} ${currency}`;
}

/** "Fri 14 Nov", for running text and page titles. */
export function formatDayShort(iso: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  })
    .format(new Date(iso))
    .replace(',', '');
}

/** "FRI 14 NOV", for mono labels. */
export function formatDay(iso: string) {
  return formatDayShort(iso).toUpperCase();
}

/** "21:00" */
export function formatTime(iso: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "FRI 14 NOV, 21:00" */
export function formatDateTime(iso: string) {
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  party: 'Parties',
  concert: 'Concerts',
  tech: 'Tech',
  career: 'Careers',
  culture: 'Culture',
  sport: 'Sport',
  workshop: 'Workshops',
  volunteering: 'Volunteering',
};

/** Trims text to a search-snippet friendly length without cutting a word in half. */
export function snippet(text: string, max = 155) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(' ', max - 3))}...`;
}
