'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import {
  PASSWORD_RULE,
  validateConfirmPassword,
  validateNewPassword,
} from '@/lib/validation';
import { Banner, Field, PasswordInput } from '@/components/ui';

/** Spec 2.1.6.1 — Reset Your Password screen. */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password: string | null; confirm: string | null }>({
    password: null,
    confirm: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = {
      password: validateNewPassword(password, 'new password'),
      confirm: validateConfirmPassword(password, confirm, 'Confirm new password'),
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) return;

    setSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        anonymous: true,
      });
      setDone(true);
      // Spec 2.1.6.1 — then back to the login screen.
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'We could not reach the server. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold text-ink">Invalid or Expired Link</h1>
        <p>This password reset link is no longer valid. Please request a new one.</p>
        <Link className="btn btn--primary w-full py-3" href="/forgot-password">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold text-ink">Password reset</h1>
        <Banner kind="success">Your password has been reset successfully.</Banner>
        <Link className="btn btn--primary w-full py-3" href="/login">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <h1 className="text-3xl font-semibold text-ink">Reset Your Password</h1>

      {formError && <Banner kind="error">{formError}</Banner>}

      <Field
        label="New Password"
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

      <Field label="Confirm New Password" htmlFor="confirm" error={errors.confirm} required>
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
        {submitting ? 'Resetting…' : 'Reset Password'}
      </button>

      <Link className="link link--muted" href="/login">
        Back to Login
      </Link>
    </form>
  );
}
