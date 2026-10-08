import {
  getCitiesByCountryAndState,
  getCountries,
  getStatesByCountry,
  isValidGeographicHierarchy,
} from './geographic-reference.data';

describe('offline geographic reference data', () => {
  it('[AC-11] filters state and city choices by their selected geographic parents', () => {
    expect(getStatesByCountry('Australia')).toContain('New South Wales');
    expect(getStatesByCountry('Australia')).not.toContain('California');
    expect(getCitiesByCountryAndState('Australia', 'New South Wales')).toContain('Sydney');
    expect(getCitiesByCountryAndState('Australia', 'Victoria')).not.toContain('Sydney');

    expect(isValidGeographicHierarchy('Australia', 'New South Wales', 'Sydney')).toBe(true);
    expect(isValidGeographicHierarchy('Australia', 'Victoria', 'Sydney')).toBe(false);
    expect(isValidGeographicHierarchy('Australia', 'California', 'Los Angeles')).toBe(false);
    expect(isValidGeographicHierarchy('Australia', undefined, 'Sydney')).toBe(false);
  });

  it('[AC-12] provides geographic names entirely from offline data without HTTP requests', () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    expect(getCountries()).toContain('Australia');
    expect(getStatesByCountry('United States')).toContain('California');
    expect(getCitiesByCountryAndState('United States', 'California')).toContain('Los Angeles');
    expect(getCountries()).not.toContain('AU');
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
