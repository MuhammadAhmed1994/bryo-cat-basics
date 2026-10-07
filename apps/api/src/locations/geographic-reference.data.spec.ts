import {
  getGeographicCities,
  getGeographicCountries,
  getGeographicStates,
  isValidGeographicHierarchy,
} from './geographic-reference.data';

describe('geographic reference data', () => {
  it('[AC-11] filters state and city choices by their geographic parents and validates the hierarchy', () => {
    expect(getGeographicStates('Australia')).toContain('New South Wales');
    expect(getGeographicStates('Canada')).not.toContain('New South Wales');
    expect(getGeographicCities('Australia', 'New South Wales')).toEqual([
      'Newcastle',
      'Sydney',
      'Wollongong',
    ]);
    expect(getGeographicCities('Canada', 'New South Wales')).toEqual([]);
    expect(isValidGeographicHierarchy('Australia', 'New South Wales', 'Sydney')).toBe(true);
    expect(isValidGeographicHierarchy('Australia', 'Queensland', 'Sydney')).toBe(false);
    expect(isValidGeographicHierarchy('Canada', 'New South Wales')).toBe(false);
  });

  it('[AC-12] serves bundled country, state, and city names without making HTTP requests', () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    expect(getGeographicCountries()).toEqual(['Australia', 'Canada', 'United States']);
    expect(getGeographicStates('United States')).toContain('California');
    expect(getGeographicCities('United States', 'California')).toContain('San Francisco');
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
