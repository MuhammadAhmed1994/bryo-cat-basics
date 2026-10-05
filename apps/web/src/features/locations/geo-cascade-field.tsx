"use client";

import { Field } from "@/components/ui";

export interface GeoValue {
  country: string;
  stateProvince: string;
  city: string;
}

interface GeoCascadeFieldProps {
  value: GeoValue;
  onChange: (value: GeoValue) => void;
}

export function GeoCascadeField({ value, onChange }: GeoCascadeFieldProps) {
  const stateDisabled = !value.country.trim();
  const cityDisabled = !value.stateProvince.trim();

  function update<K extends keyof GeoValue>(key: K, next: GeoValue[K]) {
    onChange({ ...value, [key]: next });
  }

  function handleCountryChange(next: string) {
    // AC-7 — changing Country clears State/Province and City.
    onChange({ country: next, stateProvince: "", city: "" });
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Field label="Country" htmlFor="country">
        <input
          id="country"
          value={value.country}
          placeholder="Select a country"
          onChange={(e) => handleCountryChange(e.target.value)}
        />
      </Field>

      <Field label="State/Province" htmlFor="stateProvince">
        <input
          id="stateProvince"
          value={value.stateProvince}
          disabled={stateDisabled}
          placeholder={stateDisabled ? "Select a country first" : "Select a state or province"}
          onChange={(e) => update("stateProvince", e.target.value)}
        />
      </Field>

      <Field label="City" htmlFor="city">
        <input
          id="city"
          value={value.city}
          disabled={cityDisabled}
          placeholder={cityDisabled ? "Select a state first" : "Select a city"}
          onChange={(e) => update("city", e.target.value)}
        />
      </Field>
    </div>
  );
}
