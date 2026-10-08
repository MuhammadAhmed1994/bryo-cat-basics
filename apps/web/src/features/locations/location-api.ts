import { apiFetch, buildQuery } from '@/lib/api';
import { Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';

export interface LocationRecord {
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

export type LocationUpdate = Partial<LocationInput>;

export interface LocationMutationResponse extends LocationRecord {
  message: string;
  redirectTo: string;
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

export function createLocation(values: LocationInput): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>('/locations', { method: 'POST', body: values });
}

export function getLocation(id: string): Promise<LocationRecord> {
  return apiFetch<LocationRecord>(`/locations/${encodeURIComponent(id)}`);
}

export function updateLocation(
  id: string,
  values: LocationUpdate,
): Promise<LocationMutationResponse> {
  return apiFetch<LocationMutationResponse>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: values,
  });
}

export function listLocations(
  query: LocationListQuery = {},
): Promise<Paginated<LocationRecord>> {
  return apiFetch<Paginated<LocationRecord>>(`/locations${buildQuery({ ...query })}`);
}
