import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { flaskOrganizerRequests, type OrganizerRequest } from '@/api/flask';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldHint, FieldLabel, Input, Textarea } from '@/components/ui/field';
import { useAuth } from '@/hooks/useAuth';

const MAX_NAME = 60;
const MAX_MESSAGE = 300;

export function OrganizerRequestSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<OrganizerRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const isParticipant = user?.role === 'student';

  useEffect(() => {
    if (!isParticipant) return;
    flaskOrganizerRequests
      .mine()
      .then(setCurrent)
      .catch(() => setCurrent(null))
      .finally(() => setLoading(false));
  }, [isParticipant]);

  if (!isParticipant || loading) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    const name = organizationName.trim();
    const local: Record<string, string> = {};
    if (!name) local.organizationName = 'Numele organizației este obligatoriu.';
    else if (name.length > MAX_NAME)
      local.organizationName = `Numele organizației poate avea maximum ${MAX_NAME} de caractere.`;
    if (message.trim().length > MAX_MESSAGE)
      local.message = `Mesajul poate avea maximum ${MAX_MESSAGE} de caractere.`;
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setSending(true);
    try {
      const created = await flaskOrganizerRequests.create({
        organizationName: name,
        message: message.trim(),
      });
      setCurrent(created);
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
        setErrors(err.fields);
      } else {
        setFormError(err instanceof Error ? err.message : 'A apărut o eroare, încearcă din nou.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      aria-labelledby="organizer-request-title"
      className="mt-8 grid gap-4 border-t border-border pt-6"
    >
      <h3 id="organizer-request-title" className="text-lg font-bold">
        Vrei să organizezi evenimente?
      </h3>

      {current?.status === 'in_asteptare' ? (
        <p role="status" className="rounded-md bg-muted p-3 text-sm font-semibold">
          Cererea ta este în analiză.
        </p>
      ) : current?.status === 'aprobata' ? (
        <p role="status" className="rounded-md bg-muted p-3 text-sm font-semibold">
          Cererea ta a fost aprobată. Deconectează-te și conectează-te din nou ca să vezi panoul de
          organizator.
        </p>
      ) : !open ? (
        <>
          {current?.status === 'respinsa' && (
            <p className="text-sm text-muted-foreground">
              Cererea anterioară a fost respinsă. Poți trimite una nouă.
            </p>
          )}
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Cere cont de organizator
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <Field error={errors.organizationName}>
            <FieldLabel>Numele organizației*</FieldLabel>
            <Input
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              maxLength={MAX_NAME}
              autoFocus
            />
            <FieldError />
          </Field>

          <Field error={errors.message} hint>
            <FieldLabel>Mesaj pentru admin (opțional)</FieldLabel>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_MESSAGE}
            />
            <FieldHint>
              {message.length}/{MAX_MESSAGE} caractere
            </FieldHint>
            <FieldError />
          </Field>

          {formError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={sending}>
              {sending ? 'Se trimite...' : 'Trimite cererea'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Renunță
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
