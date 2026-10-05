'use client';

import { Field } from '@/components/ui';

export interface GeoCascadeValue {
  country: string;
  stateProvince: string;
  city: string;
}

export function GeoCascadeField({
  value,
  onChange,
  idPrefix = 'geo',
}: {
  value: GeoCascadeValue;
  onChange: (next: GeoCascadeValue) => void;
  /** Optional id prefix to keep htmlFor/id pairs unique on a page. */
  idPrefix?: string;
}) {
  const stateDisabled = !value.country.trim();
  const cityDisabled = !value.stateProvince.trim();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Field label="Country" htmlFor={`${idPrefix}Country`}>
        <input
          id={`${idPrefix}Country`}
          value={value.country}
          placeholder="Select a country"
          onChange={(event) => {
            const country = event.target.value;
            // AC-7 — changing Country clears State/Province and City.
            onChange({ country, stateProvince: '', city: '' });
          }}
        />
      </Field>

      <Field label="State/Province" htmlFor={`${idPrefix}State`}>
        <input
          id={`${idPrefix}State`}
          value={value.stateProvince}
          disabled={stateDisabled}
          placeholder={stateDisabled ? 'Select a country first' : 'Select a state or province'}
          onChange={(event) =>
            onChange({ ...value, stateProvince: event.target.value, city: '' })
          }
        />
      </Field>

      <Field label="City" htmlFor={`${idPrefix}City`}>
        <input
          id={`${idPrefix}City`}
          value={value.city}
          disabled={cityDisabled}
          placeholder={cityDisabled ? 'Select a state or province first' : 'Select a city'}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
        />
      </Field>
    </div>
  );
}
