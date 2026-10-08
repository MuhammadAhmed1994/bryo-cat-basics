'use client';

import { Field } from '@/components/ui';

interface TypeaheadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string | null;
  hint?: string;
}

/** A text-backed typeahead: suggestions never restrict or replace typed values. */
export function TypeaheadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  error,
  hint,
}: TypeaheadFieldProps) {
  const listId = `${id}-suggestions`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <input
        id={id}
        name={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
        aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
        list={listId}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId} />
      {hint && <span id={hintId} className="sr-only">{hint}</span>}
      {error && <span id={errorId} className="sr-only">{error}</span>}
    </Field>
  );
}
