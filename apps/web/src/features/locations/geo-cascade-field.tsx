"use client";

import { Field } from "@/components/ui";

export interface GeoValues {
  country: string;
  stateProvince: string;
  city: string;
}

export function GeoCascadeField({ values, onChange }: { values: GeoValues; onChange: (next: GeoValues) => void }) {
  const stateDisabled = !values.country.trim();
  const cityDisabled = !values.stateProvince.trim();

  function setCountry(country: string) {
    // AC-7 — changing the Country clears State/Province and City.
    onChange({ country, stateProvince: "", city: "" });
  }

  function setState(stateProvince: string) {
    onChange({ ...values, stateProvince, city: "" });
  }

  function setCity(city: string) {
    onChange({ ...values, city });
  }

  // Simple demo options — the contract stores opaque strings; no lookups required.
  const countries = ["", "Australia", "United States", "Canada"];
  const statesByCountry: Record<string, string[]> = {
    Australia: ["", "New South Wales", "Victoria", "Queensland"],
    "United States": ["", "California", "New York"],
    Canada: ["", "Ontario", "Quebec"],
  };
  const citiesByState: Record<string, string[]> = {
    "New South Wales": ["", "Sydney", "Newcastle"],
    Victoria: ["", "Melbourne", "Geelong"],
    California: ["", "Los Angeles", "San Francisco"],
    "New York": ["", "New York City", "Buffalo"],
    Ontario: ["", "Toronto", "Ottawa"],
    Quebec: ["", "Montreal", "Quebec City"],
  };

  const stateOptions = statesByCountry[values.country] ?? [""];
  const cityOptions = citiesByState[values.stateProvince] ?? [""];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Field label="Country" htmlFor="country">
        <select id="country" value={values.country} onChange={(e) => setCountry(e.target.value)}>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c || "Select a country"}
            </option>
          ))}
        </select>
      </Field>

      <Field label="State/Province" htmlFor="stateProvince">
        <select
          id="stateProvince"
          value={values.stateProvince}
          onChange={(e) => setState(e.target.value)}
          disabled={stateDisabled}
        >
          {(stateOptions.length ? stateOptions : [""]).map((s) => (
            <option key={s} value={s}>
              {s || (stateDisabled ? "Select a country first" : "Select a state or province")}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City" htmlFor="city">
        <select id="city" value={values.city} onChange={(e) => setCity(e.target.value)} disabled={cityDisabled}>
          {(cityOptions.length ? cityOptions : [""]).map((c) => (
            <option key={c} value={c}>
              {c || (cityDisabled ? "Select a state or province first" : "Select a city")}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
