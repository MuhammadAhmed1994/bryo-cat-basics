import { apiFetch, buildQuery } from '@/lib/api';
import type {
  CreateLocationInput,
  Location,
  LocationCitiesReferenceData,
  LocationCountriesReferenceData,
  LocationListParams,
  LocationMutationResponse,
  LocationStatesReferenceData,
  PaginatedLocations,
  SetLocationStatusInput,
  UpdateLocationInput,
} from './location-types';

const LOCATIONS_PATH = '/locations';

/** Create a location. API validation errors are left intact for the caller. */
export function createLocation(input: CreateLocationInput): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>(LOCATIONS_PATH, {
    method: 'POST',
    body: input,
  });
}

/** Fetch a filtered page of locations. */
export function listLocations(params: LocationListParams = {}): Promise<PaginatedLocations> {
  return apiFetch<PaginatedLocations>(`${LOCATIONS_PATH}${buildQuery({ ...params })}`);
}

/** Retrieve one location by its identifier. */
export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`${LOCATIONS_PATH}/${encodeURIComponent(id)}`);
}

/** Update the provided fields of a location. */
export function updateLocation(
  id: string,
  input: UpdateLocationInput,
): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>(`${LOCATIONS_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/** Activate or deactivate a location. */
export function setLocationStatus(
  id: string,
  input: SetLocationStatusInput,
): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>(
    `${LOCATIONS_PATH}/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: input },
  );
}

/** Retrieve country names from the API's offline reference dataset. */
export function getLocationCountries(): Promise<LocationCountriesReferenceData> {
  return apiFetch<LocationCountriesReferenceData>(`${LOCATIONS_PATH}/reference/countries`);
}

/** Retrieve state/province names belonging to a country. */
export function getLocationStates(country: string): Promise<LocationStatesReferenceData> {
  return apiFetch<LocationStatesReferenceData>(
    `${LOCATIONS_PATH}/reference/states${buildQuery({ country })}`,
  );
}

/** Retrieve city names belonging to a country and state/province. */
export function getLocationCities(
  country: string,
  stateProvince: string,
): Promise<LocationCitiesReferenceData> {
  return apiFetch<LocationCitiesReferenceData>(
    `${LOCATIONS_PATH}/reference/cities${buildQuery({ country, stateProvince })}`,
  );
}
