import { ArrowRight, CalendarBlank, MagnifyingGlass, QrCode, Ticket } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { eventsApi } from '@/api/endpoints';
import { EventCard } from '@/components/EventCard';
import { ErrorState } from '@/components/PageState';
import { EventGridSkeleton } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { useFetch } from '@/hooks/useFetch';
import { CATEGORY_LABELS } from '@/lib/format';
import { EVENT_CATEGORIES } from '@/types/api';

/*
 * Layout follows the Mainstage reference the team picked: photo hero with a giant
 * wordmark, then alternating ink and cream bands. Static by design, nothing animates
 * on scroll (brand_guidelines.md, section 10).
 */

export function HomePage() {
  const events = useFetch(() => eventsApi.list(), 'home');
  const upcoming = events.data?.slice(0, 6);

  return (
    <>
      <Seo />
      <Hero eventCount={events.data?.length} />

      {/* Intro, cream */}
      <section className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-[88px]">
        <div className="grid content-start justify-items-start gap-6">
          <p className="type-label text-primary-text">01 / What is UniConnect</p>
          <h2 className="type-h2">
            Every campus night, <span className="text-primary-text">one ticket away.</span>
          </h2>
          <p className="max-w-[46ch] text-lg text-muted-foreground">
            Concerts, hackathons, career fairs and parties from student organizations, in one feed.
            Buy in a few taps, get your ticket by email, and show the QR at the door.
          </p>
          <Button variant="outline" asChild>
            <Link to="/events">
              Browse all events <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-5 items-end gap-3">
          <img
            src="/mock/events/about.webp"
            alt="Students talking in a campus courtyard"
            width={928}
            height={1152}
            className="col-span-3 aspect-[4/5] w-full rounded-[16px] object-cover"
          />
          <img
            src="/mock/events/talk.webp"
            alt="A guest lecture in a university hall"
            width={1200}
            height={805}
            className="col-span-2 mb-10 aspect-[3/4] w-full rounded-[16px] object-cover"
          />
        </div>
      </section>

      <Stats />

      {/* Coming up, ink */}
      <section className="surface-ink" aria-labelledby="upcoming-title">
        <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-[88px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div className="grid gap-4">
              <p className="type-label text-primary-text">02 / Coming up</p>
              <h2 id="upcoming-title" className="type-h2">
                This week on campus. <br />
                <span className="text-primary-text">Next week too.</span>
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/events">
                All events <ArrowRight />
              </Link>
            </Button>
          </div>

          {events.status === 'error' && <ErrorState error={events.error} onRetry={events.retry} />}
          {events.status === 'loading' && <EventGridSkeleton count={3} />}
          {upcoming && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <li key={e.id} className="grid">
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Categories, cream */}
      <section
        className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-[88px]"
        aria-labelledby="cat-title"
      >
        <p className="type-label mb-4 text-primary-text">03 / Find your thing</p>
        <h2 id="cat-title" className="type-h2 mb-8">
          Pick a scene.
        </h2>
        <ul className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                to={`/events?category=${c}`}
                className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-input px-5 font-semibold transition-colors duration-150 hover:bg-secondary hover:text-secondary-foreground md:min-h-14 md:px-7 md:text-lg"
              >
                {CATEGORY_LABELS[c]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HowItWorks />
      <OrganizerBand />
    </>
  );
}

function Hero({ eventCount }: { eventCount?: number }) {
  return (
    <section className="surface-ink relative isolate overflow-hidden">
      <img
        src="/mock/events/hero.webp"
        alt=""
        width={1600}
        height={679}
        fetchPriority="high"
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      {/* Solid tint, not a gradient: keeps text readable on the photo. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0b0a09]/60" />

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-14 pb-6 md:px-8 md:pt-24">
        <p className="type-label text-primary">Student events / Cluj-Napoca</p>
        <h1 className="type-h1 max-w-[16ch]">Find the night everyone will talk about tomorrow.</h1>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/events">
              Get tickets <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register?organizer=1">Organize an event</Link>
          </Button>
        </div>
        <p className="type-label text-muted-foreground">
          {eventCount ?? 'New'} events coming up / tickets by email / QR at the door
        </p>
      </div>

      {/* Giant wordmark, like the reference. aria-hidden: the header already names the site. */}
      <p
        aria-hidden
        className="mx-auto mt-16 max-w-[1200px] overflow-hidden px-2 font-display leading-[0.78] font-black tracking-[-0.045em] whitespace-nowrap uppercase [font-size:min(11.6vw,146px)] [font-stretch:112%] md:mt-28"
      >
        UniConnect<span className="text-primary">.</span>
      </p>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: '40+', label: 'student organizations' },
    { value: '8', label: 'kinds of events, from gigs to careers' },
    { value: '1', label: 'QR code per ticket, in your account and inbox' },
    { value: '0', label: 'paper tickets to lose' },
  ];
  return (
    <section className="border-y border-border" aria-label="UniConnect in numbers">
      <dl className="mx-auto grid max-w-[1200px] grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`grid content-start gap-2 border-border px-4 py-8 md:px-8 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} md:border-r md:last:border-r-0`}
          >
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-display text-[44px] leading-none font-black md:text-[56px]">
              {s.value}
            </dd>
            <dd className="text-sm text-muted-foreground">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: MagnifyingGlass,
      title: 'Find it',
      text: 'Filter by scene or search by name. Every event shows price, place and seats left.',
    },
    {
      icon: Ticket,
      title: 'Buy it',
      text: 'Pick how many tickets, pay, done. No account juggling, no printing.',
    },
    {
      icon: QrCode,
      title: 'Show it',
      text: 'Your ticket lives in My tickets and in your inbox. Show the QR at the door.',
    },
  ];
  return (
    <section className="border-t border-border" aria-labelledby="how-title">
      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-[88px]">
        <p className="type-label mb-4 text-primary-text">04 / How it works</p>
        <h2 id="how-title" className="type-h2 mb-10">
          Three steps. <span className="text-primary-text">No paper.</span>
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="grid content-start gap-3 border-t border-foreground pt-5">
              <p className="flex items-center justify-between">
                <span className="type-label text-muted-foreground">Step {i + 1}</span>
                <s.icon aria-hidden className="size-7" />
              </p>
              <h3 className="type-h3">{s.title}</h3>
              <p className="text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function OrganizerBand() {
  return (
    <section className="bg-primary text-primary-foreground" aria-labelledby="org-title">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 md:grid-cols-[1.5fr_1fr] md:items-end md:px-8 md:py-[88px]">
        <div className="grid gap-4">
          <p className="type-label">For student organizations</p>
          <h2 id="org-title" className="type-h1">
            Running an event? Sell tickets tonight.
          </h2>
          <p className="max-w-[48ch] text-lg">
            Create the event, set a price and capacity, and watch sales come in. Every buyer gets a
            QR ticket by email.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Button variant="secondary" asChild>
            <Link to="/register?organizer=1">
              <CalendarBlank /> Create an organizer account
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
