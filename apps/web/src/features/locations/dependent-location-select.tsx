'use client';

import { useId } from 'react';

interface DependentLocationSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options?: string[];
}

/**
 * A free-text typeahead for persisted geography values. No geography dataset is
 * assumed: callers may supply suggestions, while users can always enter their
 * own value. The parent controls dependency clearing.
 */
export function DependentLocationSelect({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  options = [],
}: DependentLocationSelectProps) {
  const generatedId = useId();
  const id = `location-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${generatedId}`;
  const listId = `${id}-options`;

  return (
    <div className="field">
      <label htmlFor={id}>{label} <span className="text-ink-muted">Optional</span></label>
      <input
        id={id}
        aria-label={label}
        aria-describedby={disabled ? `${id}-dependency` : undefined}
        value={value}
        list={options.length ? listId : undefined}
        disabled={disabled}
        placeholder={placeholder ?? `Search or enter ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value)}
      />
      {options.length > 0 && (
        <datalist id={listId}>
          {options.map((option) => <option key={option} value={option} />)}
        </datalist>
      )}
      {disabled && (
        <p id={`${id}-dependency`} className="hint">
          {label === 'State/Province' ? 'Choose a country first.' : 'Choose a state or province first.'}
        </p>
      )}
    </div>
  );
}
