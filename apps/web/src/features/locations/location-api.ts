import { apiFetch, buildQuery } from '@/lib/api';
import { Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';

export interface Location {
  id: string;
  name: string;
  companyId: string | null;
  company?: { id: string; name: string } | null;
  phone: string | null;
  contactPerson: string | null;
  contactPersonPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  postalCode: string | null;
  status: LocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  name: string;
  /** Use null to create a Location without an associated Company. */
  companyId: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  contactPersonPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

/** Fields accepted for a partial Location update; null clears an association or field. */
export type LocationUpdateInput = Partial<LocationInput>;

export interface LocationListQuery {
  page?: number;
  perPage?: number;
  search?: string;
  status?: LocationStatus | 'ALL';
  country?: string;
  companyId?: string;
  sortDir?: 'ASC' | 'DESC';
}

/** Create a Location. An absent Company is represented explicitly by null. */
export function createLocation(input: LocationInput): Promise<Location> {
  return apiFetch<Location>('/locations', { method: 'POST', body: input });
}

/** Retrieve one Location by id. */
export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

/** Apply partial changes to an existing Location. */
export function updateLocation(id: string, input: LocationUpdateInput): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/** List Locations with optional search, filters, sorting, and pagination. */
export function listLocations(query: LocationListQuery = {}): Promise<Paginated<Location>> {
  return apiFetch<Paginated<Location>>(`/locations${buildQuery(query)}`);
}
