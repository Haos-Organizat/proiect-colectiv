import { ArrowLeft, Check, X } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '@/api/client';
import {
  flaskAdminRequests,
  type AdminOrganizerRequest,
  type OrganizerRequestStatus,
} from '@/api/flask';
import { ErrorState, FormAlert, LoadingText } from '@/components/PageState';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldHint, FieldLabel, Textarea } from '@/components/ui/field';
import { useFetch } from '@/hooks/useFetch';
import { refreshPendingRequestCount } from '@/hooks/usePendingRequestCount';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_REASON = 300;

const STATUS: Record<
  OrganizerRequestStatus,
  { label: string; empty: string; variant: 'outline' | 'success' | 'muted' }
> = {
  in_asteptare: {
    label: 'În așteptare',
    empty: 'Nu există cereri în așteptare.',
    variant: 'outline',
  },
  aprobata: { label: 'Aprobate', empty: 'Nu există cereri aprobate.', variant: 'success' },
  respinsa: { label: 'Respinse', empty: 'Nu există cereri respinse.', variant: 'muted' },
};

const ROW_STATUS: Record<OrganizerRequestStatus, string> = {
  in_asteptare: 'În așteptare',
  aprobata: 'Aprobată',
  respinsa: 'Respinsă',
};

/** #59 Cererile de organizator: lista, aprobarea și respingerea. */
export function AdminRequestsPage() {
  const [status, setStatus] = useState<OrganizerRequestStatus>('in_asteptare');
  // Bumped after each approval/rejection so the list reloads.
  const [version, setVersion] = useState(0);
  const requests = useFetch(
    () => flaskAdminRequests.list(status),
    `admin-requests-${status}-${version}`,
  );

  const handleChanged = () => {
    setVersion((v) => v + 1);
    refreshPendingRequestCount();
  };

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-16 md:px-8">
      <Seo title="Cereri de organizator" noindex />
      <Link
        to="/admin"
        className="flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden /> Înapoi la panou
      </Link>
      <h1 className="type-h2">Cereri de organizator</h1>

      <div role="group" aria-label="Filtrează după status" className="flex flex-wrap gap-2">
        {(Object.keys(STATUS) as OrganizerRequestStatus[]).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={s === status ? 'primary' : 'outline'}
            aria-pressed={s === status}
            onClick={() => setStatus(s)}
          >
            {STATUS[s].label}
          </Button>
        ))}
      </div>

      {requests.status === 'loading' ? (
        <LoadingText>Se încarcă cererile</LoadingText>
      ) : requests.status === 'error' ? (
        <ErrorState error={requests.error} onRetry={requests.retry} />
      ) : requests.data.length === 0 ? (
        <p className="rounded-[16px] border border-border bg-card p-6 text-muted-foreground">
          {STATUS[status].empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-card">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="p-4 font-semibold">
                  Nume
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Email
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Organizație
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Mesaj
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Trimisă la
                </th>
                <th scope="col" className="p-4 font-semibold">
                  Status
                </th>
                {status === 'in_asteptare' && (
                  <th scope="col" className="p-4 font-semibold">
                    Acțiuni
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.data.map((r) => (
                <RequestRow key={r.id} request={r} onChanged={handleChanged} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request: r,
  onChanged,
}: {
  request: AdminOrganizerRequest;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const fail = (err: unknown) => {
    if (err instanceof ApiError && err.fields.reason) setReasonError(err.fields.reason);
    else setError(err instanceof Error ? err.message : 'A apărut o eroare, încearcă din nou.');
  };

  const approve = async () => {
    setSending(true);
    setError('');
    try {
      await flaskAdminRequests.approve(r.id);
      onChanged();
    } catch (err) {
      fail(err);
    } finally {
      setSending(false);
    }
  };

  const reject = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setReasonError('');
    if (reason.trim().length > MAX_REASON) {
      setReasonError(`Motivul poate avea maximum ${MAX_REASON} de caractere.`);
      return;
    }
    setSending(true);
    try {
      await flaskAdminRequests.reject(r.id, reason.trim());
      onChanged();
    } catch (err) {
      fail(err);
    } finally {
      setSending(false);
    }
  };

  const pending = r.status === 'in_asteptare';
  const cell = 'p-4 align-top';

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className={cn(cell, 'font-semibold')}>{r.userName || '—'}</td>
      <td className={cell}>{r.userEmail ?? '—'}</td>
      <td className={cell}>{r.organizationName}</td>
      <td className={cn(cell, 'max-w-[260px] whitespace-pre-line text-muted-foreground')}>
        {r.message || '—'}
      </td>
      <td className={cn(cell, 'whitespace-nowrap')}>
        {r.createdAt ? formatDateTime(r.createdAt) : '—'}
      </td>
      <td className={cell}>
        <Badge variant={STATUS[r.status].variant}>{ROW_STATUS[r.status]}</Badge>
        {r.status === 'respinsa' && r.rejectionReason && (
          <p className="mt-2 max-w-[220px] text-xs text-muted-foreground">
            Motiv: {r.rejectionReason}
          </p>
        )}
      </td>
      {pending && (
        <td className={cn(cell, 'min-w-[260px]')}>
          <div className="grid gap-3">
            {mode === 'idle' && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => setMode('approve')}>
                  <Check /> Aprobă
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setMode('reject')}>
                  <X /> Respinge
                </Button>
              </div>
            )}

            {mode === 'approve' && (
              <div className="grid gap-2">
                <p className="font-medium">
                  Aprobi cererea? {r.userName || 'Utilizatorul'} va deveni organizator.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={sending} onClick={approve}>
                    {sending ? 'Se aprobă...' : 'Da, aprobă'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>
                    Renunță
                  </Button>
                </div>
              </div>
            )}

            {mode === 'reject' && (
              <form onSubmit={reject} noValidate className="grid gap-2">
                <Field error={reasonError} hint>
                  <FieldLabel>Motivul respingerii (opțional)</FieldLabel>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={MAX_REASON}
                    rows={3}
                  />
                  <FieldHint>
                    {reason.length}/{MAX_REASON} caractere
                  </FieldHint>
                  <FieldError />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" variant="destructive" disabled={sending}>
                    {sending ? 'Se respinge...' : 'Respinge cererea'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>
                    Renunță
                  </Button>
                </div>
              </form>
            )}

            {error && <FormAlert>{error}</FormAlert>}
          </div>
        </td>
      )}
    </tr>
  );
}
