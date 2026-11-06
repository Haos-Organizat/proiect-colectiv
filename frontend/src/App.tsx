import { ArrowRight } from '@phosphor-icons/react';
import { lazy, Suspense, type ReactNode } from 'react';
import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
} from 'react-router';
import { USE_MOCKS } from '@/api/client';
import { Seo } from '@/components/Seo';
import { PageSkeleton } from '@/components/Skeletons';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { AuthProvider } from '@/components/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { EventsPage } from '@/pages/EventsPage';
import { HomePage } from '@/pages/HomePage';
import type { UserRole } from '@/types/api';

// Home and the event list load up front; pages with forms, QR codes or organizer
// tools load on demand so the first visit stays light.
const EventDetailPage = lazy(() =>
  import('@/pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })),
);
const LoginPage = lazy(() => import('@/pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/pages/AuthPages').then((m) => ({ default: m.RegisterPage })),
);
const TicketsPage = lazy(() =>
  import('@/pages/TicketsPage').then((m) => ({ default: m.TicketsPage })),
);
const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const OrganizerDashboardPage = lazy(() =>
  import('@/pages/organizer/OrganizerDashboardPage').then((m) => ({
    default: m.OrganizerDashboardPage,
  })),
);
const CreateEventPage = lazy(() =>
  import('@/pages/organizer/EventFormPage').then((m) => ({ default: m.CreateEventPage })),
);
const EditEventPage = lazy(() =>
  import('@/pages/organizer/EventFormPage').then((m) => ({ default: m.EditEventPage })),
);

function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      {USE_MOCKS && (
        <p className="bg-secondary px-4 py-1.5 text-center font-mono text-xs tracking-[0.06em] text-secondary-foreground uppercase">
          Mock data / VITE_USE_MOCKS=true
        </p>
      )}
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}

/** Sends logged-out users to /login (and back afterwards); optionally checks the role. */
function RequireAuth({ role, children }: { role?: UserRole; children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role && user.role !== 'admin') {
    return (
      <div className="mx-auto grid max-w-[1200px] justify-items-start gap-4 px-4 py-16 md:px-8">
        <h1 className="type-h2">Organizer accounts only.</h1>
        <p className="max-w-[50ch] text-muted-foreground">
          This area is for student organizations that run events. Create an organizer account to
          publish events.
        </p>
        <Button asChild>
          <Link to="/events">
            Back to events <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }
  return children;
}

function NotFoundPage() {
  return (
    <div className="mx-auto grid max-w-[1200px] justify-items-start gap-6 px-4 py-20 md:px-8">
      <Seo title="Page not found" noindex />
      <p className="type-label text-primary-text">404</p>
      <h1 className="type-h1">Nothing on this stage.</h1>
      <Button asChild>
        <Link to="/">
          Go home <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/events', element: <EventsPage /> },
      { path: '/events/:slug', element: <EventDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        path: '/account/tickets',
        element: (
          <RequireAuth>
            <TicketsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/organizer',
        element: (
          <RequireAuth role="organizer">
            <OrganizerDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: '/organizer/events/new',
        element: (
          <RequireAuth role="organizer">
            <CreateEventPage />
          </RequireAuth>
        ),
      },
      {
        path: '/organizer/events/:id/edit',
        element: (
          <RequireAuth role="organizer">
            <EditEventPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
      {
        path: '/admin',
        element: (
          <RequireAuth role="admin">
            <AdminPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
