'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { AuthUser } from '@/lib/types';
import { getRememberedEmail, rememberEmail } from '@/lib/storage';
import { normalizeEmail, validateLoginEmail, validateLoginPassword } from '@/lib/validation';
import { Banner, Field, PasswordInput } from '@/components/ui';
import { useAuth } from './auth-context';

interface Errors {
  email: string | null;
  password: string | null;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({ email: null, password: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Spec 2.1.8 — prefill the last email used on this device.
  useEffect(() => {
    setEmail(getRememberedEmail());
  }, []);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setFormError(null);

    const nextErrors: Errors = {
      email: validateLoginEmail(email),
      password: validateLoginPassword(password),
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      const result = await apiFetch<{ accessToken: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { email: normalizeEmail(email), password },
        anonymous: true,
      });

      rememberEmail(normalizeEmail(email));
      signIn(result.accessToken, result.user);

      // Spec 2.1.4 — return the user to where they were headed, if we know.
      const next = params.get('next');
      router.replace(next && next.startsWith('/') ? next : '/dashboard');
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'We could not reach the server. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div>
        <h1 className="text-3xl font-semibold text-ink">Welcome</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign in to continue</p>
      </div>

      {formError && <Banner kind="error">{formError}</Banner>}

      <Field label="Email" htmlFor="email" error={errors.email} required>
        <input
          id="email"
          type="email"
          value={email}
          placeholder="name@example.com"
          autoComplete="username"
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <div>
        <Field label="Password" htmlFor="password" error={errors.password} required>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
            // Spec 2.1.1.3 — Enter in the password field submits the form.
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />
        </Field>

        <div className="mt-2 flex justify-end">
          <Link className="link text-sm" href="/forgot-password">
            Forgot Password?
          </Link>
        </div>
      </div>

      <button type="submit" className="btn btn--primary w-full py-3" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
