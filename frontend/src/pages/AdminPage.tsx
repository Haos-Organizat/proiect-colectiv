import { ClipboardText, UsersThree } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/badge';
import { formatRequestCount, usePendingRequestCount } from '@/hooks/usePendingRequestCount';

export function AdminPage() {
  const pending = usePendingRequestCount(true);

  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 md:px-8">
      <Seo title="Admin" noindex />
      <div className="grid gap-2">
        <p className="type-label text-primary-text">Admin</p>
        <h1 className="type-h2">Panoul de administrare</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/cereri"
          className="group grid content-start gap-3 rounded-[16px] border border-border bg-card p-6 text-card-foreground transition-colors duration-150 hover:border-foreground"
        >
          <ClipboardText weight="bold" aria-hidden className="size-8 text-primary-text" />
          <h2 className="type-h4 group-hover:underline">Cereri de organizator</h2>
          <p className="text-sm text-muted-foreground">
            {formatRequestCount(pending)} în așteptare
          </p>
        </Link>

        {}
        <div
          aria-disabled="true"
          className="grid cursor-not-allowed content-start gap-3 rounded-[16px] border border-dashed border-border p-6 text-muted-foreground"
        >
          <UsersThree weight="bold" aria-hidden className="size-8" />
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-h4">Utilizatori</h2>
            <Badge variant="muted">În curând</Badge>
          </div>
          <p className="text-sm">Lista utilizatorilor va fi disponibilă în curând.</p>
        </div>
      </div>
    </div>
  );
}
