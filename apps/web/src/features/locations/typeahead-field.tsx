'use client';

interface TypeaheadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string | null;
}

/** Free-text typeahead field: users can type any value, without a reference dataset. */
export function TypeaheadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  hint,
  error,
}: TypeaheadFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
        aria-disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && !error && <p id={`${id}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="error" role="alert">{error}</p>}
    </div>
  );
}
