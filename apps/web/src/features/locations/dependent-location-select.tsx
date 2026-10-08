'use client';

import { Field } from '@/components/ui';

export interface DependentLocationSelectProps {
  country: string;
  stateProvince: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  countries?: string[];
  states?: string[];
  cities?: string[];
  idPrefix?: string;
}

/**
 * Free-text, datalist-backed address selectors. Geography data is optional:
 * no unapproved reference dataset is assumed, and users can always type a value.
 */
export function DependentLocationSelect({
  country,
  stateProvince,
  city,
  onCountryChange,
  onStateProvinceChange,
  onCityChange,
  countries = [],
  states = [],
  cities = [],
  idPrefix = 'location',
}: DependentLocationSelectProps) {
  const countryId = `${idPrefix}-country`;
  const stateId = `${idPrefix}-state-province`;
  const cityId = `${idPrefix}-city`;
  const stateDisabled = !country.trim();
  const cityDisabled = !stateProvince.trim();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Country" htmlFor={countryId} hint="Choose a country before state/province and city.">
        <input
          id={countryId}
          value={country}
          list={`${countryId}-options`}
          autoComplete="off"
          placeholder="Search or enter a country"
          onChange={(event) => onCountryChange(event.target.value)}
        />
        <datalist id={`${countryId}-options`}>
          {countries.map((option) => <option key={option} value={option} />)}
        </datalist>
      </Field>

      <Field label="State/Province" htmlFor={stateId}>
        <input
          id={stateId}
          value={stateProvince}
          list={`${stateId}-options`}
          autoComplete="off"
          disabled={stateDisabled}
          placeholder={stateDisabled ? 'Choose a country first' : 'Search or enter a state/province'}
          onChange={(event) => onStateProvinceChange(event.target.value)}
        />
        <datalist id={`${stateId}-options`}>
          {states.map((option) => <option key={option} value={option} />)}
        </datalist>
      </Field>

      <Field label="City" htmlFor={cityId}>
        <input
          id={cityId}
          value={city}
          list={`${cityId}-options`}
          autoComplete="off"
          disabled={cityDisabled}
          placeholder={cityDisabled ? 'Choose a state/province first' : 'Search or enter a city'}
          onChange={(event) => onCityChange(event.target.value)}
        />
        <datalist id={`${cityId}-options`}>
          {cities.map((option) => <option key={option} value={option} />)}
        </datalist>
      </Field>
    </div>
  );
}
