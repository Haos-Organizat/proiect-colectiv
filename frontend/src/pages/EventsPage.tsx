import { MagnifyingGlass } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { eventsApi } from '@/api/endpoints';
import { EventCard } from '@/components/EventCard';
import { ErrorState } from '@/components/PageState';
import { EventGridSkeleton } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, Input } from '@/components/ui/field';
import { useFetch } from '@/hooks/useFetch';
import { CATEGORY_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORIES, type EventCategory } from '@/types/api';

function isCategory(value: string | null): value is EventCategory {
  return EVENT_CATEGORIES.includes(value as EventCategory);
}

export function EventsPage() {
  const [params, setParams] = useSearchParams();
  const rawCategory = params.get('category');
  const category = isCategory(rawCategory) ? rawCategory : undefined;
  const q = params.get('q') ?? '';
  const [query, setQuery] = useState(q);

  const events = useFetch(
    () => eventsApi.list({ category, q: q || undefined }),
    `${category}|${q}`,
  );

  const update = (next: { category?: EventCategory; q?: string }) => {
    const p = new URLSearchParams();
    if (next.category) p.set('category', next.category);
    if (next.q) p.set('q', next.q);
    setParams(p, { replace: true });
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ category, q: query.trim() });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <Seo
        title={category ? `${CATEGORY_LABELS[category]} for students` : 'Student events'}
        description={
          category
            ? `${CATEGORY_LABELS[category]} for students in Cluj-Napoca. See dates, venues and prices, and get your ticket on UniConnect.`
            : 'Every upcoming student event in Cluj-Napoca: concerts, hackathons, career fairs, parties and more. Buy tickets in a few taps.'
        }
      />
      <p className="type-label mb-4 text-primary-text">All events</p>
      <h1 className="type-h1 mb-8">What's on.</h1>

      <form role="search" onSubmit={onSearch} className="mb-6 flex items-end gap-2">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Search events</FieldLabel>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or venue"
            enterKeyHint="search"
          />
        </Field>
        <Button
          type="submit"
          variant="secondary"
          size="icon"
          aria-label="Search"
          className="size-12"
        >
          <MagnifyingGlass />
        </Button>
      </form>

      <div
        role="group"
        aria-label="Filter by category"
        className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0"
      >
        {[undefined, ...EVENT_CATEGORIES].map((c) => {
          const active = c === category;
          return (
            <button
              key={c ?? 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => update({ category: c, q })}
              className={cn(
                'min-h-10 shrink-0 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors duration-150',
                active
                  ? 'border-secondary bg-secondary text-secondary-foreground'
                  : 'border-input hover:bg-accent',
              )}
            >
              {c ? CATEGORY_LABELS[c] : 'All'}
            </button>
          );
        })}
      </div>

      {events.status === 'error' && <ErrorState error={events.error} onRetry={events.retry} />}
      {events.status === 'loading' && <EventGridSkeleton />}
      {events.status === 'success' &&
        (events.data.length === 0 ? (
          <div className="grid justify-items-start gap-4 rounded-[16px] border border-border bg-card p-6">
            <p className="font-semibold">
              No events match that. Try another scene or clear the search.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                update({});
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.data.map((e) => (
              <li key={e.id} className="grid">
                <EventCard event={e} />
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
