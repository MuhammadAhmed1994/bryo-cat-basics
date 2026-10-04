'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch } from '@/lib/api';
import { normalizeEmail, validateLoginEmail } from '@/lib/validation';
import { Banner, Field } from '@/components/ui';

/** Spec 2.1.6.1 / 2.1.6.2 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const emailError = validateLoginEmail(email);
    setError(emailError);
    if (emailError) return;

    setSubmitting(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: normalizeEmail(email) },
        anonymous: true,
      });
      setSent(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'We could not reach the server. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Spec 2.1.6.2 — "Help is on its way" screen.
  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold text-ink">Help is on its way</h1>
        <p>We have sent you an email with instructions to reset your password.</p>
        <p className="text-sm text-ink-soft">
          If you don&rsquo;t hear from us in the next 15 minutes, please check your spam folder.
        </p>
        <Link className="btn btn--primary w-full py-3" href="/login">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <h1 className="text-3xl font-semibold text-ink">Forgot password</h1>
      <p className="text-sm text-ink-soft">
        Enter your email address and we will send you a reset link.
      </p>

      {formError && <Banner kind="error">{formError}</Banner>}

      <Field label="Email" htmlFor="email" error={error} required>
        <input
          id="email"
          type="email"
          value={email}
          placeholder="name@example.com"
          autoComplete="username"
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <button type="submit" className="btn btn--primary w-full py-3" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit'}
      </button>

      <Link className="link link--muted" href="/login">
        Back to Login
      </Link>
    </form>
  );
}
