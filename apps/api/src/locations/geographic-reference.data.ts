/**
 * Offline geographic reference data used by location forms and validation.
 * Keep the hierarchy in this file so reference lookups never depend on a
 * third-party service at runtime. The supported coverage is Australia, Canada,
 * India, New Zealand, the United Kingdom, and the United States.
 */
export interface GeographicStateReference {
  readonly name: string;
  readonly cities: readonly string[];
}

export interface GeographicCountryReference {
  readonly name: string;
  readonly states: readonly GeographicStateReference[];
}

export const GEOGRAPHIC_REFERENCE_DATA: readonly GeographicCountryReference[] = [
  {
    name: 'Australia',
    states: [
      { name: 'Australian Capital Territory', cities: ['Canberra'] },
      { name: 'New South Wales', cities: ['Albury', 'Newcastle', 'Sydney', 'Wollongong'] },
      { name: 'Northern Territory', cities: ['Alice Springs', 'Darwin'] },
      { name: 'Queensland', cities: ['Brisbane', 'Cairns', 'Gold Coast', 'Townsville'] },
      { name: 'South Australia', cities: ['Adelaide', 'Mount Gambier', 'Whyalla'] },
      { name: 'Tasmania', cities: ['Burnie', 'Hobart', 'Launceston'] },
      { name: 'Victoria', cities: ['Ballarat', 'Geelong', 'Melbourne', 'Shepparton'] },
      { name: 'Western Australia', cities: ['Albany', 'Bunbury', 'Perth'] },
    ],
  },
  {
    name: 'Canada',
    states: [
      { name: 'Alberta', cities: ['Calgary', 'Edmonton', 'Red Deer'] },
      { name: 'British Columbia', cities: ['Kamloops', 'Vancouver', 'Victoria'] },
      { name: 'Manitoba', cities: ['Brandon', 'Winnipeg'] },
      { name: 'New Brunswick', cities: ['Fredericton', 'Moncton'] },
      { name: 'Newfoundland and Labrador', cities: ["St. John's"] },
      { name: 'Nova Scotia', cities: ['Halifax', 'Sydney'] },
      { name: 'Ontario', cities: ['Hamilton', 'Ottawa', 'Toronto', 'Windsor'] },
      { name: 'Prince Edward Island', cities: ['Charlottetown'] },
      { name: 'Quebec', cities: ['Montreal', 'Quebec City', 'Sherbrooke'] },
      { name: 'Saskatchewan', cities: ['Regina', 'Saskatoon'] },
      { name: 'Northwest Territories', cities: ['Yellowknife'] },
      { name: 'Nunavut', cities: ['Iqaluit'] },
      { name: 'Yukon', cities: ['Whitehorse'] },
    ],
  },
  {
    name: 'India',
    states: [
      { name: 'Delhi', cities: ['New Delhi'] },
      { name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara'] },
      { name: 'Karnataka', cities: ['Bengaluru', 'Mysuru'] },
      { name: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram'] },
      { name: 'Maharashtra', cities: ['Mumbai', 'Nagpur', 'Pune'] },
      { name: 'Rajasthan', cities: ['Jaipur', 'Jodhpur'] },
      { name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai'] },
      { name: 'Uttar Pradesh', cities: ['Agra', 'Lucknow', 'Varanasi'] },
      { name: 'West Bengal', cities: ['Kolkata'] },
    ],
  },
  {
    name: 'New Zealand',
    states: [
      { name: 'Auckland', cities: ['Auckland'] },
      { name: 'Canterbury', cities: ['Christchurch'] },
      { name: 'Otago', cities: ['Dunedin', 'Queenstown'] },
      { name: 'Waikato', cities: ['Hamilton'] },
      { name: 'Wellington', cities: ['Lower Hutt', 'Wellington'] },
    ],
  },
  {
    name: 'United Kingdom',
    states: [
      { name: 'England', cities: ['Birmingham', 'Bristol', 'Leeds', 'Liverpool', 'London', 'Manchester'] },
      { name: 'Northern Ireland', cities: ['Belfast', 'Derry'] },
      { name: 'Scotland', cities: ['Aberdeen', 'Edinburgh', 'Glasgow', 'Inverness'] },
      { name: 'Wales', cities: ['Cardiff', 'Newport', 'Swansea'] },
    ],
  },
  {
    name: 'United States',
    states: [
      { name: 'California', cities: ['Los Angeles', 'Sacramento', 'San Diego', 'San Francisco'] },
      { name: 'Florida', cities: ['Jacksonville', 'Miami', 'Orlando', 'Tampa'] },
      { name: 'Illinois', cities: ['Chicago', 'Springfield'] },
      { name: 'Massachusetts', cities: ['Boston', 'Worcester'] },
      { name: 'New York', cities: ['Albany', 'Buffalo', 'New York City'] },
      { name: 'Ohio', cities: ['Cincinnati', 'Cleveland', 'Columbus'] },
      { name: 'Pennsylvania', cities: ['Harrisburg', 'Philadelphia', 'Pittsburgh'] },
      { name: 'Texas', cities: ['Austin', 'Dallas', 'Houston', 'San Antonio'] },
      { name: 'Washington', cities: ['Seattle', 'Spokane', 'Tacoma'] },
    ],
  },
];

/** Returns country names in the order presented by the offline dataset. */
export function getCountries(): string[] {
  return GEOGRAPHIC_REFERENCE_DATA.map(({ name }) => name);
}

/** Returns state/province/region names belonging to the named country. */
export function getStatesByCountry(country: string): string[] {
  const reference = findCountry(country);
  return reference?.states.map(({ name }) => name) ?? [];
}

/** Returns city names belonging to both the named country and subdivision. */
export function getCitiesByCountryAndState(country: string, stateProvince: string): string[] {
  const reference = findCountry(country);
  const state = reference?.states.find(({ name }) => sameName(name, stateProvince));
  return state?.cities.slice() ?? [];
}

/**
 * Checks that each supplied geographic name exists beneath its selected parent.
 * Country is required; state/province and city may be omitted, but a city
 * cannot be supplied without its state/province.
 */
export function isValidGeographicHierarchy(
  country: string,
  stateProvince?: string | null,
  city?: string | null,
): boolean {
  const countryReference = findCountry(country);
  if (!countryReference) return false;

  const stateName = stateProvince?.trim();
  const cityName = city?.trim();
  if (cityName && !stateName) return false;
  if (!stateName) return !cityName;

  const state = countryReference.states.find(({ name }) => sameName(name, stateName));
  if (!state) return false;
  return !cityName || state.cities.some((name) => sameName(name, cityName));
}

function findCountry(country: string): GeographicCountryReference | undefined {
  return GEOGRAPHIC_REFERENCE_DATA.find(({ name }) => sameName(name, country));
}

function sameName(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('en') === right.trim().toLocaleLowerCase('en');
}
