import { apiFetch, buildQuery } from '@/lib/api';
import type {
  CitiesReferenceData,
  CountriesReferenceData,
  CreateLocationPayload,
  ListLocationsParams,
  Location,
  LocationMutationResult,
  LocationStatusResult,
  PaginatedLocations,
  SetLocationStatusPayload,
  StatesReferenceData,
  UpdateLocationPayload,
} from './location-types';

/** The API client passes API errors through unchanged for callers to present. */
export function createLocation(payload: CreateLocationPayload): Promise<LocationMutationResult> {
  return apiFetch<LocationMutationResult>('/locations', {
    method: 'POST',
    body: payload,
  });
}

export function listLocations(params: ListLocationsParams = {}): Promise<PaginatedLocations> {
  const query = buildQuery({
    search: params.search,
    status: params.status,
    country: params.country,
    companyId: params.companyId,
    page: params.page,
    perPage: params.perPage,
    sortDir: params.sortDir,
  });
  return apiFetch<PaginatedLocations>(`/locations${query}`);
}

export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

export function updateLocation(
  id: string,
  payload: UpdateLocationPayload,
): Promise<LocationMutationResult> {
  return apiFetch<LocationMutationResult>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function setLocationStatus(
  id: string,
  payload: SetLocationStatusPayload,
): Promise<LocationStatusResult> {
  return apiFetch<LocationStatusResult>(`/locations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: payload,
  });
}

export function getCountries(): Promise<CountriesReferenceData> {
  return apiFetch<CountriesReferenceData>('/locations/reference/countries');
}

export function getStates(country: string): Promise<StatesReferenceData> {
  const query = buildQuery({ country });
  return apiFetch<StatesReferenceData>(`/locations/reference/states${query}`);
}

export function getCities(country: string, stateProvince: string): Promise<CitiesReferenceData> {
  const query = buildQuery({ country, stateProvince });
  return apiFetch<CitiesReferenceData>(`/locations/reference/cities${query}`);
}
