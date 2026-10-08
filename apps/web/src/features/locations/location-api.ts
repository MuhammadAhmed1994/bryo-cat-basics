import { ApiError, apiFetch } from '@/lib/api';
import { CompanyChoices, Location, LocationPayload } from './location-types';

export type LocationField = keyof LocationPayload;

export class LocationApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<LocationField, string>> = {},
  ) {
    super(message);
    this.name = 'LocationApiError';
  }
}

function fieldErrorsFor(message: string): Partial<Record<LocationField, string>> {
  const lower = message.toLowerCase();
  const errors: Partial<Record<LocationField, string>> = {};
  if (/duplicate|already exists|unique|name/.test(lower)) errors.name = message;
  if (/phone/.test(lower)) {
    if (/contact/.test(lower)) errors.contactPersonPhone = message;
    else errors.phone = message;
  }
  if (/country/.test(lower)) errors.country = message;
  if (/state|province/.test(lower)) errors.stateProvince = message;
  if (/city/.test(lower)) errors.city = message;
  if (/company/.test(lower)) errors.companyId = message;
  return errors;
}

async function locationRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof LocationApiError) throw error;
    const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
    throw new LocationApiError(message, fieldErrorsFor(message));
  }
}

/** Active choices only; companyId remains nullable in all Location requests. */
export async function getActiveCompanies(): Promise<LocationChoices> {
  return locationRequest(async () => {
    const result = await apiFetch<CompanyChoices | LocationCompany[]>('/companies?activeOnly=true');
    return Array.isArray(result) ? result : result.data;
  });
}

type LocationChoices = import('./location-types').LocationCompany[];
type LocationCompany = import('./location-types').LocationCompany;

export function getLocation(id: string): Promise<Location> {
  return locationRequest(() => apiFetch<Location>(`/locations/${encodeURIComponent(id)}`));
}

export function createLocation(payload: LocationPayload): Promise<Location> {
  return locationRequest(() => apiFetch<Location>('/locations', { method: 'POST', body: payload }));
}

export function updateLocation(id: string, payload: LocationPayload): Promise<Location> {
  return locationRequest(() =>
    apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),
  );
}
