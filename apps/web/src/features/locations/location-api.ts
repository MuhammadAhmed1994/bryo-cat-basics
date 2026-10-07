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

export type LocationInput = Omit<Location, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
export type CreateLocationInput = Omit<LocationInput, 'companyId'> & {
  companyId?: string | null;
};
export type UpdateLocationInput = Partial<CreateLocationInput>;

export interface LocationListParams {
  search?: string;
  status?: LocationStatus | 'ALL';
  country?: string;
  companyId?: string;
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
}

export function createLocation(input: CreateLocationInput): Promise<Location> {
  return apiFetch<Location>('/locations', {
    method: 'POST',
    body: { ...input, companyId: input.companyId ?? null },
  });
}

export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

export function updateLocation(id: string, input: UpdateLocationInput): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

export function listLocations(params: LocationListParams = {}): Promise<Paginated<Location>> {
  const query = buildQuery(params);
  return apiFetch<Paginated<Location>>(`/locations${query}`);
}
