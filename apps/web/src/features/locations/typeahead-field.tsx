'use client';

import { Field } from '@/components/ui';

interface TypeaheadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options?: string[];
  error?: string | null;
}

/** A native, keyboard-accessible typeahead that also accepts arbitrary text. */
export function TypeaheadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  options = [],
  error,
}: TypeaheadFieldProps) {
  const listId = `${id}-suggestions`;
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        list={options.length ? listId : undefined}
        aria-disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {options.length > 0 && (
        <datalist id={listId}>
          {options.map((option) => <option key={option} value={option} />)}
        </datalist>
      )}
      {error && <p id={`${id}-error`} className="error" role="alert">{error}</p>}
    </Field>
  );
}
