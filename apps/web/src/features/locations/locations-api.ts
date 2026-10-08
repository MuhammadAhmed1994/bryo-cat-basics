import { apiFetch, buildQuery } from '@/lib/api';
import type { Company, Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';
export type LocationStatusFilter = LocationStatus | 'ALL';
export type SortDirection = 'ASC' | 'DESC';

/** API representation of a Location, including its optional Company relation. */
export interface Location {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  nameNormalized: string;
  description: string | null;
  status: LocationStatus;
  companyId: string | null;
  company?: Company | null;
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

/** Fields accepted when creating a Location. Name is the only required input. */
export interface CreateLocationInput {
  name: string;
  description?: string | null;
  status?: LocationStatus;
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

/** Partial update fields. Use companyId: null to remove the association. */
export type UpdateLocationInput = Partial<CreateLocationInput>;

export interface ListLocationsParams {
  search?: string;
  status?: LocationStatusFilter;
  country?: string;
  companyId?: string;
  sortDir?: SortDirection;
  page?: number;
  perPage?: 25 | 50 | 100;
}

/**
 * POST /api/locations. apiFetch throws ApiError for unsuccessful responses,
 * preserving API validation messages for form-level feedback.
 */
export function createLocation(input: CreateLocationInput): Promise<Location> {
  return apiFetch<Location>('/locations', { method: 'POST', body: input });
}

/**
 * GET /api/locations. Apply the API defaults explicitly so callers serialize
 * the same Active, name-ascending, first-page, 50-row view on every request.
 */
export function listLocations(
  params: ListLocationsParams = {},
): Promise<Paginated<Location>> {
  const query = buildQuery({
    search: params.search?.trim(),
    status: params.status ?? 'ACTIVE',
    country: params.country?.trim(),
    companyId: params.companyId,
    sortDir: params.sortDir ?? 'ASC',
    page: params.page ?? 1,
    perPage: params.perPage ?? 50,
  });
  return apiFetch<Paginated<Location>>(`/locations${query}`);
}

/** GET /api/locations/:id. */
export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

/** PATCH /api/locations/:id. */
export function updateLocation(
  id: string,
  input: UpdateLocationInput,
): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/**
 * Return all active Companies for the optional Location selector. Fetching
 * subsequent pages avoids silently omitting selector choices when the active
 * Company count is greater than the API page size.
 */
export async function getActiveCompanies(): Promise<Company[]> {
  const perPage = 100;
  const companies: Company[] = [];
  let page = 1;
  let total = 0;

  do {
    const query = buildQuery({ status: 'ACTIVE', sortDir: 'ASC', page, perPage });
    const result = await apiFetch<Paginated<Company>>(`/companies${query}`);
    companies.push(...result.data);
    total = result.total;
    page += 1;
  } while (companies.length < total);

  return companies;
}
