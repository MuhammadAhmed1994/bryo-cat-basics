"use client";

import { Field } from "@/components/ui";

interface GeoCascadeFieldProps {
  country: string;
  stateProvince: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
}

/**
 * Country → State/Province → City cascading inputs.
 * - State/Province disabled until Country has a value
 * - City disabled until State/Province has a value
 * - Changing Country clears State/Province and City (the parent should do this)
 */
export function GeoCascadeField({
  country,
  stateProvince,
  city,
  onCountryChange,
  onStateProvinceChange,
  onCityChange,
}: GeoCascadeFieldProps) {
  const stateDisabled = !country;
  const cityDisabled = !stateProvince;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Field label="Country" htmlFor="country">
        <input
          id="country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        />
      </Field>

      <Field label="State/Province" htmlFor="stateProvince">
        <input
          id="stateProvince"
          value={stateProvince}
          onChange={(e) => onStateProvinceChange(e.target.value)}
          disabled={stateDisabled}
          aria-disabled={stateDisabled}
        />
      </Field>

      <Field label="City" htmlFor="city">
        <input
          id="city"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={cityDisabled}
          aria-disabled={cityDisabled}
        />
      </Field>
    </div>
  );
}
