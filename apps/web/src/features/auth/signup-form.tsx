'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { AuthUser } from '@/lib/types';
import {
  PASSWORD_RULE,
  validateConfirmPassword,
  validateFirstName,
  validateLastName,
  validateNewPassword,
} from '@/lib/validation';
import { Banner, Field, PasswordInput, Spinner } from '@/components/ui';
import { useAuth } from './auth-context';

interface Invitation {
  email: string;
  firstName: string;
  lastName: string;
}

interface Errors {
  firstName: string | null;
  lastName: string | null;
  password: string | null;
  confirm: string | null;
}

const NO_ERRORS: Errors = { firstName: null, lastName: null, password: null, confirm: null };

/** Spec 2.5.1.2 — Create an Account screen. */
export function SignupForm({ token }: { token: string }) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvitationError(
        'This invitation link is no longer valid. It may have expired or a new invitation may have been sent. Please contact your administrator for a new invitation.',
      );
      setLoading(false);
      return;
    }

    apiFetch<Invitation>(`/auth/invitation?token=${encodeURIComponent(token)}`, {
      anonymous: true,
    })
      .then((data) => {
        setInvitation(data);
        // Spec 2.5.1.2 — names are prefilled and editable; email is read-only.
        setFirstName(data.firstName);
        setLastName(data.lastName);
      })
      .catch((error) =>
        setInvitationError(
          error instanceof ApiError ? error.message : 'We could not load your invitation.',
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: Errors = {
      firstName: validateFirstName(firstName),
      lastName: validateLastName(lastName),
      password: validateNewPassword(password),
      confirm: validateConfirmPassword(password, confirm, 'Confirm password'),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const result = await apiFetch<{ accessToken: string; user: AuthUser }>('/auth/signup', {
        method: 'POST',
        body: { token, firstName: firstName.trim(), lastName: lastName.trim(), password },
        anonymous: true,
      });

      // Spec 2.5.1.2 — the user is signed in and lands on the dashboard.
      signIn(result.accessToken, result.user);
      router.replace('/dashboard');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'We could not create your account.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Spinner label="Checking your invitation" />
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold text-ink">Invalid or Expired Link</h1>
        <p>{invitationError}</p>
        <Link className="btn btn--primary w-full py-3" href="/login">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <h1 className="text-3xl font-semibold text-ink">Create Your Account</h1>
      <p className="text-sm text-ink-soft">
        You&rsquo;ve been invited to create an account using {invitation.email}.
      </p>

      {formError && <Banner kind="error">{formError}</Banner>}

      <Field label="First Name" htmlFor="firstName" error={errors.firstName} required>
        <input
          id="firstName"
          value={firstName}
          maxLength={50}
          onChange={(event) => setFirstName(event.target.value)}
        />
      </Field>

      <Field label="Last Name" htmlFor="lastName" error={errors.lastName} required>
        <input
          id="lastName"
          value={lastName}
          maxLength={50}
          onChange={(event) => setLastName(event.target.value)}
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <input id="email" value={invitation.email} readOnly />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint={PASSWORD_RULE}
        required
      >
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          visible={show}
          onToggleVisible={() => setShow((v) => !v)}
        />
      </Field>

      <Field label="Confirm Password" htmlFor="confirm" error={errors.confirm} required>
        <PasswordInput
          id="confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          visible={show}
          onToggleVisible={() => setShow((v) => !v)}
        />
      </Field>

      <button type="submit" className="btn btn--primary w-full py-3" disabled={submitting}>
        {submitting ? 'Creating your account…' : 'Create Account'}
      </button>
    </form>
  );
}
