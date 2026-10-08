'use client';

interface DependentLocationSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  suggestions?: string[];
}

/**
 * A searchable, free-text location field. No geography catalog is assumed;
 * optional suggestions can be supplied by a future reference-data provider.
 */
export function DependentLocationSelect({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  helperText,
  suggestions = [],
}: DependentLocationSelectProps) {
  const listId = `${id}-suggestions`;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="field min-w-0">
      <label htmlFor={id}>
        {label} <span className="text-xs font-normal text-ink-muted">Optional</span>
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
        aria-describedby={helperId}
        value={value}
        list={suggestions.length ? listId : undefined}
        disabled={disabled}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value)}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
      {helperText && (
        <p id={helperId} className="hint">
          {helperText}
        </p>
      )}
    </div>
  );
}
