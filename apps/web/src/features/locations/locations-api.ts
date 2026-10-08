import { apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';
export type LocationStatusFilter = LocationStatus | 'ALL';
export type LocationSortDirection = 'ASC' | 'DESC';

/** Location record returned by the API. Empty optional fields are represented as null. */
export interface Location {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string | null;
  status: LocationStatus;
  companyId: string | null;
  company?: Pick<Company, 'id' | 'name'> | null;
  phone: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  contactPersonEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  postalCode: string | null;
}

/** Fields accepted by both the create and update Location endpoints. */
export interface LocationInput {
  name?: string;
  description?: string | null;
  status?: LocationStatus;
  /** null removes an existing Company association. */
  companyId?: string | null;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
  contactPersonEmail?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export type CreateLocationInput = LocationInput & { name: string };
export type UpdateLocationInput = LocationInput;

export interface ListLocationsParams {
  search?: string;
  status?: LocationStatusFilter;
  country?: string;
  companyId?: string;
  sortDir?: LocationSortDirection;
  page?: number;
  perPage?: number;
}

const LOCATION_LIST_DEFAULTS: Required<Pick<
  ListLocationsParams,
  'status' | 'sortDir' | 'page' | 'perPage'
>> = {
  status: 'ACTIVE',
  sortDir: 'ASC',
  page: 1,
  perPage: 50,
};

/** Create a Location; API validation errors are propagated as ApiError by apiFetch. */
export function createLocation(input: CreateLocationInput): Promise<Location> {
  return apiFetch<Location>('/locations', { method: 'POST', body: input });
}

/**
 * List Locations using the API's Active, name-ascending, first-page, 50-row
 * defaults. Search is trimmed before it is sent, matching the API contract.
 */
export function listLocations(params: ListLocationsParams = {}): Promise<Paginated<Location>> {
  const query = buildQuery({
    search: params.search?.trim(),
    status: params.status ?? LOCATION_LIST_DEFAULTS.status,
    country: params.country?.trim(),
    companyId: params.companyId,
    sortDir: params.sortDir ?? LOCATION_LIST_DEFAULTS.sortDir,
    page: params.page ?? LOCATION_LIST_DEFAULTS.page,
    perPage: params.perPage ?? LOCATION_LIST_DEFAULTS.perPage,
  });

  return apiFetch<Paginated<Location>>(`/locations${query}`);
}

/** Retrieve one Location by its identifier. */
export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

/** Update the supplied Location fields; unsuccessful responses are not swallowed. */
export function updateLocation(id: string, input: UpdateLocationInput): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/**
 * Load active Company options for Location selectors. The API response remains
 * paginated so callers can handle a large Company list without losing metadata.
 */
export function listActiveCompanies(): Promise<Paginated<Company>> {
  const query = buildQuery({ status: 'ACTIVE', sortDir: 'ASC', page: 1, perPage: 100 });
  return apiFetch<Paginated<Company>>(`/companies${query}`);
}
