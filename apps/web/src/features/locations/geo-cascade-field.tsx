"use client";

import { Field } from "@/components/ui";

interface GeoCascadeFieldProps {
  country: string;
  stateProvince: string;
  city: string;
  onChange: (patch: Partial<{ country: string; stateProvince: string; city: string }>) => void;
}

// Tiny built-in options to drive the selects — the API stores opaque strings and
// the UI must not assume a particular dataset exists (ADR-4). This list is only
// to make the selects operable in tests and is not authoritative.
const GEO: Record<string, Record<string, string[]>> = {
  Australia: {
    'New South Wales': ['Sydney', 'Newcastle'],
    Victoria: ['Melbourne', 'Geelong'],
  },
  'United States': {
    California: ['San Francisco', 'Los Angeles'],
    'New York': ['New York City', 'Buffalo'],
  },
};

export function GeoCascadeField({ country, stateProvince, city, onChange }: GeoCascadeFieldProps) {
  const countries = Object.keys(GEO);
  const states = country ? Object.keys(GEO[country] ?? {}) : [];
  const cities = country && stateProvince ? GEO[country]?.[stateProvince] ?? [] : [];

  const stateDisabled = !country.trim();
  const cityDisabled = !stateProvince.trim();

  function changeCountry(next: string) {
    // Changing country clears both children (AC-7).
    onChange({ country: next, stateProvince: '', city: '' });
  }
  function changeState(next: string) {
    // Changing state clears the city.
    onChange({ stateProvince: next, city: '' });
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Country" htmlFor="country">
        <select id="country" value={country} onChange={(e) => changeCountry(e.target.value)}>
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="State/Province" htmlFor="stateProvince">
        <select
          id="stateProvince"
          value={stateProvince}
          disabled={stateDisabled}
          aria-disabled={stateDisabled}
          onChange={(e) => changeState(e.target.value)}
        >
          <option value="">{stateDisabled ? 'Select a country first' : 'Select a state or province'}</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City" htmlFor="city">
        <select
          id="city"
          value={city}
          disabled={cityDisabled}
          aria-disabled={cityDisabled}
          onChange={(e) => onChange({ city: e.target.value })}
        >
          <option value="">{cityDisabled ? 'Select a state or province first' : 'Select a city'}</option>
          {cities.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
