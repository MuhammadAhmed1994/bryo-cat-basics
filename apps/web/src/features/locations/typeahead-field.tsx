'use client';

import { Field } from '@/components/ui';

interface TypeaheadFieldProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledHint?: string;
  error?: string | null;
  hint?: string;
}

/** A native, keyboard-accessible typeahead that stores the text the user enters. */
export function TypeaheadField({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  disabledHint,
  error,
  hint,
}: TypeaheadFieldProps) {
  const listId = `${id}-suggestions`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <input
        id={id}
        value={value}
        list={listId}
        disabled={disabled}
        placeholder={disabled ? disabledHint : `Enter ${label.toLowerCase()}`}
        aria-disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={[
          hint ? descriptionId : '',
          disabled && disabledHint ? descriptionId : '',
          error ? errorId : '',
        ].filter(Boolean).join(' ') || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {options.map((option) => <option key={option} value={option} />)}
      </datalist>
      {(hint || (disabled && disabledHint)) && (
        <span id={descriptionId} className="sr-only">{disabled ? disabledHint : hint}</span>
      )}
      {error && <span id={errorId} className="sr-only">{error}</span>}
    </Field>
  );
}
