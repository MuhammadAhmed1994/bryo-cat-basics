import { apiFetch, buildQuery } from '@/lib/api';
import { Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';
export type LocationCompanyId = string | null;

/** A Location record returned by the Location API. */
export interface Location {
  id: string;
  name: string;
  companyId: LocationCompanyId;
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

/** Fields accepted by POST /api/locations. An absent company is explicitly null. */
export interface CreateLocationInput {
  name: string;
  companyId: LocationCompanyId;
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

/** Fields accepted by PATCH /api/locations/:id. Null clears an optional field. */
export type UpdateLocationInput = Partial<CreateLocationInput>;

export interface LocationListQuery {
  search?: string;
  status?: LocationStatus | 'ALL';
  country?: string;
  companyId?: string;
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
}

export type LocationMutationResult = Location & { message: string };

/** Create one Location; use companyId: null when it has no Company association. */
export function createLocation(input: CreateLocationInput): Promise<LocationMutationResult> {
  return apiFetch<LocationMutationResult>('/locations', { method: 'POST', body: input });
}

/** Retrieve a Location by its identifier. */
export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

/** Partially update a Location. Set companyId to null to remove its association. */
export function updateLocation(
  id: string,
  input: UpdateLocationInput,
): Promise<LocationMutationResult> {
  return apiFetch<LocationMutationResult>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/** List Locations with the API's search, status, association, sort, and paging filters. */
export function listLocations(query: LocationListQuery = {}): Promise<Paginated<Location>> {
  const params: Record<string, string | number | undefined> = {
    search: query.search,
    status: query.status,
    country: query.country,
    companyId: query.companyId,
    sortDir: query.sortDir,
    page: query.page,
    perPage: query.perPage,
  };
  return apiFetch<Paginated<Location>>(`/locations${buildQuery(params)}`);
}
