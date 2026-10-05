"use client";

import { Field } from '@/components/ui';

export interface GeoValue {
  country: string;
  stateProvince: string;
  city: string;
}

export function GeoCascadeField({
  value,
  onChange,
  idPrefix = 'geo',
}: {
  value: GeoValue;
  onChange: (next: Partial<GeoValue>) => void;
  idPrefix?: string;
}) {
  const stateDisabled = !value.country.trim();
  const cityDisabled = !value.stateProvince.trim();

  function setCountry(country: string) {
    // AC-7 — changing Country clears State/Province and City.
    onChange({ country, stateProvince: '', city: '' });
  }

  function setStateProvince(stateProvince: string) {
    // City remains disabled until a state/province is chosen.
    onChange({ stateProvince });
  }

  function setCity(city: string) {
    onChange({ city });
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Country" htmlFor={`${idPrefix}-country`}>
        <input
          id={`${idPrefix}-country`}
          value={value.country}
          placeholder="Select a country"
          onChange={(e) => setCountry(e.target.value)}
        />
      </Field>

      <Field label="State/Province" htmlFor={`${idPrefix}-state`}>
        <input
          id={`${idPrefix}-state`}
          value={value.stateProvince}
          disabled={stateDisabled}
          placeholder={stateDisabled ? 'Select a country first' : 'Select a state or province'}
          onChange={(e) => setStateProvince(e.target.value)}
        />
      </Field>

      <Field label="City" htmlFor={`${idPrefix}-city`}>
        <input
          id={`${idPrefix}-city`}
          value={value.city}
          disabled={cityDisabled}
          placeholder={cityDisabled ? 'Select a state or province first' : 'Select a city'}
          onChange={(e) => setCity(e.target.value)}
        />
      </Field>
    </div>
  );
}
