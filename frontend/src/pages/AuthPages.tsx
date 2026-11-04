import { zodResolver } from '@hookform/resolvers/zod';
import { SignIn, UserPlus } from '@phosphor-icons/react';
import { useState, type ReactNode } from 'react';
import { useForm, type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';
import { Link, Navigate, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ApiError, USE_MOCKS } from '@/api/client';
import { authApi } from '@/api/endpoints';
import { FormAlert } from '@/components/PageState';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldError, FieldHint, FieldLabel, Input } from '@/components/ui/field';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@/types/schemas';

/** Where to go after auth: the page that sent the user here, or a sensible default. */
function useRedirectTarget(fallback: string) {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith('/') ? from : fallback;
}

/** Map a 4xx from the API onto form fields, or return a message for the whole form. */
function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>) {
  if (err instanceof ApiError) {
    const entries = Object.entries(err.fields);
    entries.forEach(([field, message], i) =>
      setError(field as Path<T>, { message }, { shouldFocus: i === 0 }),
    );
    return entries.length ? null : err.message;
  }
  return 'Could not reach the server. Try again in a moment.';
}

function AuthShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const tab = (to: string, label: string) => (
    <NavLink
      to={to}
      state={location.state}
      replace
      className={({ isActive }) =>
        cn(
          'flex min-h-11 flex-1 items-center justify-center rounded-full text-[15px] font-semibold transition-colors duration-150',
          isActive ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent',
        )
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 md:grid-cols-2 md:items-start md:gap-16 md:px-8 md:py-16">
      <div className="grid content-start gap-4 md:sticky md:top-28">
        <p className="type-label text-primary-text">Your account</p>
        <h1 className="type-h1">{title}</h1>
        <p className="max-w-[40ch] text-lg text-muted-foreground">{lede}</p>
        <img
          src="/mock/events/concert.webp"
          alt=""
          width={1200}
          height={805}
          className="mt-4 hidden aspect-[3/2] w-full rounded-[16px] object-cover md:block"
        />
      </div>
      <div className="grid gap-6 rounded-[16px] border border-border bg-card p-5 md:p-8">
        <nav aria-label="Account" className="flex gap-1 rounded-full border border-border p-1">
          {tab('/login', 'Log in')}
          {tab('/register', 'Create account')}
        </nav>
        {/* key restarts the panel animation when switching tabs */}
        <div key={location.pathname} className="motion-safe:animate-panel-in">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget('/account/tickets');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  if (user) return <Navigate to={target} replace />;

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      setUser(await authApi.login(values));
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  return (
    <AuthShell title="Welcome back." lede="Log in to see your tickets and buy new ones.">
      <Seo title="Log in" noindex />
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <Field error={errors.email?.message}>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
          <FieldError />
        </Field>
        <Field error={errors.password?.message}>
          <FieldLabel>Password</FieldLabel>
          <Input type="password" autoComplete="current-password" {...register('password')} />
          <FieldError />
        </Field>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" disabled={isSubmitting}>
          <SignIn /> {isSubmitting ? 'Logging in' : 'Log in'}
        </Button>
        {USE_MOCKS && (
          <p className="text-sm text-muted-foreground">
            Mock mode: demo accounts are listed in{' '}
            <code className="font-mono">frontend/README.md</code>.
          </p>
        )}
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wantsOrganizer = params.get('organizer') === '1';
  const target = useRedirectTarget(wantsOrganizer ? '/organizer' : '/events');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      isOrganizer: wantsOrganizer,
      acceptTerms: false as unknown as true,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  if (user) return <Navigate to={target} replace />;

  const onSubmit = async (values: RegisterInput) => {
    setFormError(null);
    try {
      const created = await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: values.isOrganizer ? 'organizer' : 'student',
      });
      setUser(created);
      navigate(created.role === 'organizer' ? '/organizer' : target, { replace: true });
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  return (
    <AuthShell
      title={wantsOrganizer ? 'Bring your event.' : 'Join the campus.'}
      lede="One account for every student event. Your tickets stay here and in your inbox."
    >
      <Seo title="Create account" noindex />
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field error={errors.firstName?.message}>
            <FieldLabel>First name</FieldLabel>
            <Input autoComplete="given-name" {...register('firstName')} />
            <FieldError />
          </Field>
          <Field error={errors.lastName?.message}>
            <FieldLabel>Last name</FieldLabel>
            <Input autoComplete="family-name" {...register('lastName')} />
            <FieldError />
          </Field>
        </div>
        <Field error={errors.email?.message}>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
          <FieldError />
        </Field>
        <Field error={errors.password?.message} hint>
          <FieldLabel>Password</FieldLabel>
          <Input type="password" autoComplete="new-password" {...register('password')} />
          <FieldHint>At least 8 characters, with an uppercase and a lowercase letter.</FieldHint>
          <FieldError />
        </Field>
        <Field error={errors.confirmPassword?.message}>
          <FieldLabel>Repeat password</FieldLabel>
          <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
          <FieldError />
        </Field>
        {/* The real backend creates every account as a participant; organizers are set
            by an admin for now (see docs/api-contract.md). Only the mock honors this. */}
        {USE_MOCKS && (
          <Field>
            <Checkbox {...register('isOrganizer')}>
              I organize events for a student organization
            </Checkbox>
          </Field>
        )}
        <Field error={errors.acceptTerms?.message}>
          <Checkbox {...register('acceptTerms')}>
            I accept the{' '}
            <Link to="/" className="text-primary-text underline">
              terms and privacy policy
            </Link>
          </Checkbox>
          <FieldError />
        </Field>
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" disabled={isSubmitting}>
          <UserPlus /> {isSubmitting ? 'Creating account' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
