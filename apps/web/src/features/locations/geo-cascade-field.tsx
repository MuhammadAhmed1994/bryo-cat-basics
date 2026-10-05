"use client";

import { Field } from "@/components/ui";

export interface GeoCascadeValue {
  country: string;
  state: string;
  city: string;
}

interface GeoCascadeFieldProps {
  value: GeoCascadeValue;
  onChange: (value: GeoCascadeValue) => void;
}

/**
 * GeoCascadeField implements the AC-7 cascade rules:
 * - State/Province disabled until a Country is chosen
 * - City disabled until a State/Province is chosen
 * - Changing Country clears both State/Province and City selections
 */
export function GeoCascadeField({ value, onChange }: GeoCascadeFieldProps) {
  const stateDisabled = !value.country.trim();
  const cityDisabled = !value.state.trim();

  function setCountry(country: string) {
    // Changing country clears state and city (AC-7)
    onChange({ country, state: "", city: "" });
  }
  function setState(state: string) {
    // When state changes, city selection is cleared to avoid cross-state cities
    onChange({ country: value.country, state, city: "" });
  }
  function setCity(city: string) {
    onChange({ country: value.country, state: value.state, city });
  }

  return (
    <section className="card px-7 py-6">
      <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Country" htmlFor="country">
          <input
            id="country"
            value={value.country}
            placeholder="Select a country"
            onChange={(e) => setCountry(e.target.value)}
          />
        </Field>

        <Field label="State/Province" htmlFor="state">
          <input
            id="state"
            value={value.state}
            disabled={stateDisabled}
            placeholder={stateDisabled ? "Select a country first" : "Select a state or province"}
            onChange={(e) => setState(e.target.value)}
          />
        </Field>

        <Field label="City" htmlFor="city">
          <input
            id="city"
            value={value.city}
            disabled={cityDisabled}
            placeholder={cityDisabled ? "Select a state or province first" : "Select a city"}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
      </div>
    </section>
  );
}
