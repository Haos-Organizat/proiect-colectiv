import { List, Moon, SignOut, Sun, Ticket, X } from '@phosphor-icons/react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/Wordmark';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'font-semibold underline-offset-[6px] hover:underline',
    isActive && 'text-primary-text underline decoration-2',
  );

export function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/events', label: 'Events' },
    ...(user
      ? [
          { to: '/account/tickets', label: 'My tickets' },
          { to: '/profile', label: 'Profile' },
        ]
      : []),
    ...(user?.role === 'organizer' || user?.role === 'admin'
      ? [{ to: '/organizer', label: 'Organizer' }]
      : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-8">
        <Link to="/" aria-label="UniConnect home" className="text-[22px]">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            {/* While the session is being checked show neither state, so "Log in" never flashes. */}
            {user === undefined ? null : user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <SignOut /> Log out
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/events">
                    <Ticket /> Get tickets
                  </Link>
                </Button>
              </>
            )}
          </div>

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <List />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 motion-safe:animate-fade-in" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(320px,85vw)] flex-col gap-8 border-l border-border bg-background p-4 motion-safe:animate-fade-in">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="type-label text-muted-foreground">Menu</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close menu">
                      <X />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
                <nav aria-label="Mobile" className="grid gap-1">
                  {[{ to: '/', label: 'Home' }, ...links].map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.to === '/'}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn('type-h3 py-2', isActive && 'text-primary-text')
                      }
                    >
                      {l.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto grid gap-2">
                  {user ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Signed in as{' '}
                        <span className="font-semibold text-foreground">{user.name}</span>
                      </p>
                      <Button variant="outline" onClick={handleLogout}>
                        <SignOut /> Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild onClick={() => setMenuOpen(false)}>
                        <Link to="/register">Create account</Link>
                      </Button>
                      <Button variant="outline" asChild onClick={() => setMenuOpen(false)}>
                        <Link to="/login">Log in</Link>
                      </Button>
                    </>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
