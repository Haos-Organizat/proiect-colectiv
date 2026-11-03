import { zodResolver } from '@hookform/resolvers/zod';
import { FloppyDisk, Image as ImageIcon, PaperPlaneTilt, Prohibit } from '@phosphor-icons/react';
import { useState, type ChangeEvent, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { organizerApi, type EventPayload } from '@/api/endpoints';
import { ErrorState, FormAlert } from '@/components/PageState';
import { FormSkeleton } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldError, FieldHint, FieldLabel, Input, Textarea } from '@/components/ui/field';
import { Select, SelectItem } from '@/components/ui/select';
import { TimeSelect } from '@/components/ui/time-select';
import { useFetch } from '@/hooks/useFetch';
import { CATEGORY_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORIES, type OrganizerEvent } from '@/types/api';
import { eventFormSchema, type EventFormInput } from '@/types/schemas';

const TIME_ZONE = 'Europe/Bucharest';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Splits an ISO date into the local date and time strings the inputs use. */
function toLocalParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

function toFormValues(e: OrganizerEvent): EventFormInput {
  const start = toLocalParts(e.startsAt);
  return {
    title: e.title,
    category: e.category,
    description: e.description,
    date: start.date,
    startTime: start.time,
    endTime: toLocalParts(e.endsAt).time,
    venue: e.venue,
    city: e.city,
    price: e.price.amount / 100,
    capacity: e.capacity,
    maxPerOrder: e.maxPerOrder,
    imageUrl: e.imageUrl,
  };
}

function toPayload(v: EventFormInput, status: EventPayload['status']): EventPayload {
  return {
    title: v.title,
    category: v.category,
    description: v.description,
    // Local wall-clock time; the browser adds the user's offset when converting.
    startsAt: new Date(`${v.date}T${v.startTime}`).toISOString(),
    endsAt: new Date(`${v.date}T${v.endTime}`).toISOString(),
    venue: v.venue,
    city: v.city,
    imageUrl: v.imageUrl,
    price: { amount: Math.round(v.price * 100), currency: 'RON' },
    capacity: v.capacity,
    maxPerOrder: v.maxPerOrder,
    status,
  };
}

export function CreateEventPage() {
  return <EventForm />;
}

export function EditEventPage() {
  const { id = '' } = useParams();
  const event = useFetch(() => organizerApi.event(id), id);
  if (event.status === 'loading') return <FormSkeleton />;
  if (event.status === 'error') {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
        <ErrorState error={event.error} />
      </div>
    );
  }
  return <EventForm event={event.data} />;
}

function EventForm({ event }: { event?: OrganizerEvent }) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isFree, setIsFree] = useState(event ? event.price.amount === 0 : false);
  const [submitting, setSubmitting] = useState<EventPayload['status'] | 'cancel' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event
      ? toFormValues(event)
      : {
          title: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          venue: '',
          city: 'Cluj-Napoca',
          capacity: 100,
          maxPerOrder: 4,
          imageUrl: '',
        },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const imageUrl = useWatch({ control, name: 'imageUrl' });

  const choosePricing = (free: boolean) => {
    setIsFree(free);
    setValue('price', free ? 0 : (undefined as unknown as number), { shouldValidate: free });
  };

  const onImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('imageUrl', { message: 'Choose an image file (JPG, PNG or WebP).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('imageUrl', { message: 'Images must be under 5 MB.' });
      return;
    }
    setUploading(true);
    clearErrors('imageUrl');
    try {
      const { url } = await organizerApi.uploadImage(file);
      setValue('imageUrl', url, { shouldValidate: true });
    } catch (err) {
      setError('imageUrl', {
        message: err instanceof ApiError ? err.message : 'Upload failed. Try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const save = (status: EventPayload['status']) =>
    handleSubmit(
      async (values) => {
        setFormError(null);
        setSubmitting(status);
        try {
          const payload = toPayload({ ...values, price: isFree ? 0 : values.price }, status);
          if (event) await organizerApi.updateEvent(event.id, payload);
          else await organizerApi.createEvent(payload);
          navigate('/organizer');
        } catch (err) {
          if (err instanceof ApiError && Object.keys(err.fields).length) {
            Object.entries(err.fields).forEach(([f, message], i) =>
              setError(f as keyof EventFormInput, { message }, { shouldFocus: i === 0 }),
            );
          } else {
            setFormError(err instanceof ApiError ? err.message : 'Could not save the event.');
          }
        } finally {
          setSubmitting(null);
        }
      },
      (errs: FieldErrors<EventFormInput>) => {
        // Price is hidden for free events; anything else focuses itself via RHF.
        if (Object.keys(errs).length)
          setFormError('Some fields need attention. Check the messages above.');
      },
    );

  const cancelEvent = async () => {
    if (!event || !window.confirm('Cancel this event? Ticket holders will be notified by email.'))
      return;
    setSubmitting('cancel');
    try {
      await organizerApi.updateEvent(event.id, { status: 'cancelled' });
      navigate('/organizer');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not cancel the event.');
      setSubmitting(null);
    }
  };

  const busy = submitting !== null || uploading;

  return (
    <div className="mx-auto max-w-[880px] px-4 py-10 md:px-8 md:py-16">
      <Seo title={event ? `Edit ${event.title}` : 'Create an event'} noindex />
      <p className="type-label mb-4 text-primary-text">
        <Link to="/organizer" className="hover:underline">
          Organizer
        </Link>{' '}
        / {event ? 'Edit event' : 'New event'}
      </p>
      <h1 className="type-h1 mb-10">{event ? event.title : 'Create an event.'}</h1>

      <form noValidate onSubmit={save('published')} className="grid gap-10">
        <Section title="The basics">
          <Field error={errors.title?.message}>
            <FieldLabel>Event name</FieldLabel>
            <Input {...register('title')} />
            <FieldError />
          </Field>
          <Field error={errors.category?.message}>
            <FieldLabel>Category</FieldLabel>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Choose a category"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />
            <FieldError />
          </Field>
          <Field error={errors.description?.message} hint>
            <FieldLabel>Description</FieldLabel>
            <Textarea rows={6} {...register('description')} />
            <FieldHint>
              What happens, who it is for, what to bring. At least 30 characters.
            </FieldHint>
            <FieldError />
          </Field>
        </Section>

        <Section title="Cover photo">
          <Field error={errors.imageUrl?.message} hint>
            <FieldLabel>Photo</FieldLabel>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Cover preview"
                className="aspect-video w-full rounded-[16px] object-cover"
              />
            )}
            <label
              className={cn(
                'flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-input px-5 font-semibold transition-colors duration-150 hover:bg-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                errors.imageUrl && 'border-destructive',
              )}
            >
              <ImageIcon aria-hidden className="size-[18px]" />
              {uploading ? 'Uploading' : imageUrl ? 'Replace photo' : 'Upload photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onImage}
                disabled={uploading}
                aria-invalid={errors.imageUrl ? true : undefined}
              />
            </label>
            <FieldHint>
              Landscape works best, at least 1200 px wide. JPG, PNG or WebP under 5 MB.
            </FieldHint>
            <FieldError />
          </Field>
        </Section>

        <Section title="When and where">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field error={errors.date?.message}>
              <FieldLabel>Date</FieldLabel>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={todayKey()}
                  />
                )}
              />
              <FieldError />
            </Field>
            <Field error={errors.startTime?.message}>
              <FieldLabel>Starts</FieldLabel>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <TimeSelect
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <FieldError />
            </Field>
            <Field error={errors.endTime?.message}>
              <FieldLabel>Ends</FieldLabel>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <TimeSelect
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <FieldError />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field error={errors.venue?.message}>
              <FieldLabel>Venue</FieldLabel>
              <Input {...register('venue')} />
              <FieldError />
            </Field>
            <Field error={errors.city?.message}>
              <FieldLabel>City</FieldLabel>
              <Input autoComplete="address-level2" {...register('city')} />
              <FieldError />
            </Field>
          </div>
        </Section>

        <Section title="Tickets">
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-[15px] font-semibold">Pricing</legend>
            <div className="flex gap-1 rounded-full border border-border p-1">
              {[
                { free: true, label: 'Free' },
                { free: false, label: 'Paid' },
              ].map((o) => (
                <label
                  key={o.label}
                  className={cn(
                    'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                    isFree === o.free
                      ? 'bg-secondary text-secondary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  <input
                    type="radio"
                    name="pricing"
                    className="sr-only"
                    checked={isFree === o.free}
                    onChange={() => choosePricing(o.free)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-3">
            {!isFree && (
              <Field error={errors.price?.message}>
                <FieldLabel>Price (RON)</FieldLabel>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.5"
                  {...register('price', { valueAsNumber: true })}
                />
                <FieldError />
              </Field>
            )}
            <Field error={errors.capacity?.message}>
              <FieldLabel>Capacity</FieldLabel>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                {...register('capacity', { valueAsNumber: true })}
              />
              <FieldError />
            </Field>
            <Field error={errors.maxPerOrder?.message} hint>
              <FieldLabel>Max per order</FieldLabel>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                {...register('maxPerOrder', { valueAsNumber: true })}
              />
              <FieldHint>1 to 10</FieldHint>
              <FieldError />
            </Field>
          </div>
        </Section>

        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          {event && event.status !== 'cancelled' && (
            <Button
              type="button"
              variant="ghost"
              className="sm:mr-auto"
              onClick={cancelEvent}
              disabled={busy}
            >
              <Prohibit /> {submitting === 'cancel' ? 'Cancelling' : 'Cancel event'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={save('draft')} disabled={busy}>
            <FloppyDisk /> {submitting === 'draft' ? 'Saving' : 'Save draft'}
          </Button>
          <Button type="submit" disabled={busy}>
            <PaperPlaneTilt />{' '}
            {submitting === 'published'
              ? 'Publishing'
              : event?.status === 'published'
                ? 'Save changes'
                : 'Publish'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5">
      <h2 className="type-h3 border-b border-border pb-3">{title}</h2>
      {children}
    </section>
  );
}
