'use client';

import { Field } from '@/components/ui';

interface TypeaheadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  suggestions?: string[];
}

/**
 * Free-text typeahead input. Suggestions are optional: geography reference
 * datasets are deliberately not assumed, and whatever the user types is saved.
 */
export function TypeaheadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Type or select a value',
  hint,
  error,
  suggestions = [],
}: TypeaheadFieldProps) {
  const listId = `${id}-suggestions`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
        aria-controls={listId}
        aria-describedby={describedBy}
        value={value}
        list={listId}
        disabled={disabled}
        placeholder={disabled ? 'Select the parent location first' : placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {hint && <span id={hintId} className="sr-only">{hint}</span>}
      {error && <span id={errorId} className="sr-only">{error}</span>}
    </Field>
  );
}
