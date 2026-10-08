import { apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';
export type LocationStatusFilter = LocationStatus | 'ALL';

/** A Location returned by the API, including its nullable Company relation. */
export interface Location {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  nameNormalized: string;
  description: string | null;
  status: LocationStatus;
  companyId: string | null;
  company: Company | null;
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

/** Values accepted when creating a Location. */
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

/** Every field is optional for PATCH; null clears nullable values/Company. */
export type UpdateLocationInput = Partial<CreateLocationInput>;

export interface ListLocationsQuery {
  search?: string;
  status?: LocationStatusFilter;
  country?: string;
  companyId?: string;
  page?: number;
  perPage?: 25 | 50 | 100;
}

const LOCATION_LIST_DEFAULTS = {
  status: 'ACTIVE' as const,
  page: 1,
  perPage: 50 as const,
};

/**
 * The API always sorts Locations by name ascending. Its defaults are Active,
 * name A–Z, and 50 records per page; explicitly serialize the query defaults
 * so requests have stable and predictable URLs.
 */
export async function listLocations(
  query: ListLocationsQuery = {},
): Promise<Paginated<Location>> {
  const params = buildQuery({
    status: query.status ?? LOCATION_LIST_DEFAULTS.status,
    search: query.search?.trim() || undefined,
    country: query.country?.trim() || undefined,
    companyId: query.companyId || undefined,
    page: query.page ?? LOCATION_LIST_DEFAULTS.page,
    perPage: query.perPage ?? LOCATION_LIST_DEFAULTS.perPage,
  });
  return apiFetch<Paginated<Location>>(`/locations${params}`);
}

export function createLocation(input: CreateLocationInput): Promise<Location> {
  return apiFetch<Location>('/locations', { method: 'POST', body: input });
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

/**
 * Fetch every active Company in name order for Location selectors. The API is
 * paginated, so continue until all available options have been collected.
 */
export async function getActiveCompanies(): Promise<Company[]> {
  const perPage = 100 as const;
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
