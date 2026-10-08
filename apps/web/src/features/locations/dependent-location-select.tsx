'use client';

interface DependentLocationSelectProps {
  country: string;
  stateProvince: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  countries?: string[];
  stateProvinceOptions?: string[];
  cityOptions?: string[];
  idPrefix?: string;
}

/**
 * Searchable, free-text hierarchy selectors. The application has no approved
 * geography reference source, so suggestions are optional and values remain
 * editable text rather than being restricted to a fixed dataset.
 */
export function DependentLocationSelect({
  country,
  stateProvince,
  city,
  onCountryChange,
  onStateProvinceChange,
  onCityChange,
  countries = [],
  stateProvinceOptions = [],
  cityOptions = [],
  idPrefix = 'location',
}: DependentLocationSelectProps) {
  const stateDisabled = country.trim().length === 0;
  const cityDisabled = stateProvince.trim().length === 0;

  function changeCountry(value: string) {
    onCountryChange(value);
    onStateProvinceChange('');
    onCityChange('');
  }

  function changeState(value: string) {
    onStateProvinceChange(value);
    onCityChange('');
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div className="field">
        <label htmlFor={`${idPrefix}-country`}>Country <span className="optional">Optional</span></label>
        <input
          id={`${idPrefix}-country`}
          type="search"
          role="combobox"
          aria-label="Country"
          aria-describedby={`${idPrefix}-hierarchy-help`}
          value={country}
          list={`${idPrefix}-countries`}
          placeholder="Search or enter a country"
          onChange={(event) => changeCountry(event.target.value)}
        />
        <datalist id={`${idPrefix}-countries`}>
          {countries.map((option) => <option key={option} value={option} />)}
        </datalist>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-state`}>State / Province <span className="optional">Optional</span></label>
        <input
          id={`${idPrefix}-state`}
          type="search"
          role="combobox"
          aria-label="State / Province"
          aria-describedby={`${idPrefix}-hierarchy-help`}
          value={stateProvince}
          list={`${idPrefix}-states`}
          placeholder={stateDisabled ? 'Choose a country first' : 'Search or enter a state / province'}
          disabled={stateDisabled}
          onChange={(event) => changeState(event.target.value)}
        />
        <datalist id={`${idPrefix}-states`}>
          {stateProvinceOptions.map((option) => <option key={option} value={option} />)}
        </datalist>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-city`}>City <span className="optional">Optional</span></label>
        <input
          id={`${idPrefix}-city`}
          type="search"
          role="combobox"
          aria-label="City"
          aria-describedby={`${idPrefix}-hierarchy-help`}
          value={city}
          list={`${idPrefix}-cities`}
          placeholder={cityDisabled ? 'Choose a state / province first' : 'Search or enter a city'}
          disabled={cityDisabled}
          onChange={(event) => onCityChange(event.target.value)}
        />
        <datalist id={`${idPrefix}-cities`}>
          {cityOptions.map((option) => <option key={option} value={option} />)}
        </datalist>
      </div>
      <p className="hint md:col-span-2 xl:col-span-3" id={`${idPrefix}-hierarchy-help`}>
        Choose a country before state / province, then choose a state / province before city.
      </p>
    </div>
  );
}
