import { apiFetch, buildQuery } from '@/lib/api';
import { Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';

export interface Location {
  id: string;
  name: string;
  companyId: string | null;
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
  companyId?: string | null;
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

export interface LocationListQuery {
  search?: string;
  status?: LocationStatus | 'ALL';
  country?: string;
  companyId?: string;
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
}

export interface LocationMutationResponse extends Location {
  message: string;
  redirectTo: string;
}

/** Create a Location. An omitted or cleared Company association is null. */
export function createLocation(input: LocationInput): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>('/locations', {
    method: 'POST',
    body: { ...input, companyId: input.companyId ?? null },
  });
}

export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

export function updateLocation(
  id: string,
  input: Partial<LocationInput>,
): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

export function listLocations(query: LocationListQuery = {}): Promise<Paginated<Location>> {
  return apiFetch<Paginated<Location>>(`/locations${buildQuery(query)}`);
}
