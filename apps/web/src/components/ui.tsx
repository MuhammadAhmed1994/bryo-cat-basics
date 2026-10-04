'use client';

import { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/** Outlined input with the floating green label used across the reference UI. */
export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {/* Spec 2.1.7 — the rule shows before the user submits, not after. */}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  visible: boolean;
  onToggleVisible: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** Spec 2.1.1.2 — masked by default with an explicit show/hide control. */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  visible,
  onToggleVisible,
  onKeyDown,
}: PasswordInputProps) {
  return (
    <div className="password-input">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="reveal"
        onClick={onToggleVisible}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/** Spec 2.8.7 — green when active, grey when inactive. */
export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        active ? 'bg-brand' : 'bg-ink-muted'
      }`}
      aria-label={active ? 'Active' : 'Inactive'}
      title={active ? 'Active' : 'Inactive'}
    />
  );
}

/** Spec 2.2.5 — truncate with an ellipsis and expose the full value on hover. */
export function Truncated({ value }: { value: string }) {
  return (
    <span className="truncate-cell" title={value}>
      {value}
    </span>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-ink-soft" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}…
    </div>
  );
}

export function Banner({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return (
    <div className={`banner banner--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

/** Spec 2.2.8 — short success messages, auto-dismissed after 3 seconds. */
export function Toast({ message }: { message: string }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-menu"
      role="status"
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-lg text-sm text-ink-soft">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------- Icons (inline so the app pulls in no icon dependency) ---------- */

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 004.2 4.2" />
      <path d="M9.4 5.2A9.7 9.7 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.2 6.6A17 17 0 002 12s3.5 7 10 7a9.8 9.8 0 003.6-.7" />
    </svg>
  );
}
