import { Link } from 'react-router';
import { Wordmark } from '@/components/Wordmark';

export function SiteFooter() {
  return (
    <footer className="surface-ink border-t border-border">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div className="grid content-start gap-4">
          <Link to="/" aria-label="UniConnect home" className="text-[32px]">
            <Wordmark />
          </Link>
          <p className="max-w-[34ch] text-muted-foreground">
            Student events, tickets and QR check-in, in one place.
          </p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-3">
          <p className="type-label text-muted-foreground">Explore</p>
          <Link to="/events" className="hover:underline">
            All events
          </Link>
          <Link to="/account/tickets" className="hover:underline">
            My tickets
          </Link>
        </nav>
        <nav aria-label="Organizers" className="grid content-start gap-3">
          <p className="type-label text-muted-foreground">Organizers</p>
          <Link to="/organizer" className="hover:underline">
            Organizer dashboard
          </Link>
          <Link to="/register?organizer=1" className="hover:underline">
            Become an organizer
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-8 md:px-8">
        <p className="type-label text-muted-foreground">
          UniConnect {new Date().getFullYear()} / Proiect Colectiv
        </p>
      </div>
    </footer>
  );
}
