export interface GeographicState {
  readonly name: string;
  readonly cities: readonly string[];
}

export interface GeographicCountry {
  readonly name: string;
  readonly states: readonly GeographicState[];
}

/**
 * Offline geographic reference names used by the location form and validation.
 * Keep states and cities nested under their parent names so dependent choices
 * and hierarchy checks use the same source of truth.
 */
export const GEOGRAPHIC_REFERENCE_DATA: readonly GeographicCountry[] = [
  {
    name: 'Australia',
    states: [
      { name: 'New South Wales', cities: ['Newcastle', 'Sydney', 'Wollongong'] },
      { name: 'Queensland', cities: ['Brisbane', 'Cairns', 'Gold Coast'] },
      { name: 'Victoria', cities: ['Ballarat', 'Geelong', 'Melbourne'] },
    ],
  },
  {
    name: 'Canada',
    states: [
      { name: 'Alberta', cities: ['Calgary', 'Edmonton', 'Red Deer'] },
      { name: 'British Columbia', cities: ['Kelowna', 'Vancouver', 'Victoria'] },
      { name: 'Ontario', cities: ['Hamilton', 'Ottawa', 'Toronto'] },
      { name: 'Quebec', cities: ['Gatineau', 'Montreal', 'Quebec City'] },
    ],
  },
  {
    name: 'United States',
    states: [
      { name: 'California', cities: ['Los Angeles', 'San Diego', 'San Francisco'] },
      { name: 'New York', cities: ['Albany', 'Buffalo', 'New York City'] },
      { name: 'Texas', cities: ['Austin', 'Dallas', 'Houston'] },
    ],
  },
];

/** Return available country names from the bundled offline dataset. */
export function getGeographicCountries(): string[] {
  return GEOGRAPHIC_REFERENCE_DATA.map(({ name }) => name);
}

/** Return state/province names belonging to the exact country name. */
export function getGeographicStates(countryName: string): string[] {
  const country = GEOGRAPHIC_REFERENCE_DATA.find(({ name }) => name === countryName);
  return country?.states.map(({ name }) => name) ?? [];
}

/** Return city names belonging to the exact country and state/province names. */
export function getGeographicCities(countryName: string, stateProvinceName: string): string[] {
  const country = GEOGRAPHIC_REFERENCE_DATA.find(({ name }) => name === countryName);
  const state = country?.states.find(({ name }) => name === stateProvinceName);
  return state?.cities.slice() ?? [];
}

/**
 * Verify that supplied names form a valid parent-child path in the dataset.
 * State and city are optional, but a city cannot be supplied without a state.
 */
export function isValidGeographicHierarchy(
  countryName: string,
  stateProvinceName?: string | null,
  cityName?: string | null,
): boolean {
  const country = GEOGRAPHIC_REFERENCE_DATA.find(({ name }) => name === countryName);
  if (!country) return false;
  if (!stateProvinceName) return cityName == null;

  const state = country.states.find(({ name }) => name === stateProvinceName);
  if (!state) return false;
  return cityName == null || state.cities.includes(cityName);
}
