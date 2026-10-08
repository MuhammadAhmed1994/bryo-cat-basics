import { apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';
export type LocationStatusFilter = LocationStatus | 'ALL';

/** A nullable Company relation is returned alongside the foreign-key value. */
export interface Location {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
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

/**
 * Create and update accept the same editable fields. Empty optional values can
 * be sent as null to clear them; omitted values are left unchanged on PATCH.
 */
export interface LocationInput {
  name?: string;
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

export interface CreateLocationInput extends LocationInput {
  name: string;
}

export interface ListLocationsOptions {
  search?: string;
  status?: LocationStatusFilter;
  country?: string;
  companyId?: string;
  page?: number;
  perPage?: 25 | 50 | 100;
}

/**
 * The API currently sorts Location lists by name ascending. Its defaults are
 * made explicit here so callers get the same Active/page-1/50-row list even if
 * API defaults change; filter/search values are serialized in a stable order.
 */
export function listLocations(
  options: ListLocationsOptions = {},
): Promise<Paginated<Location>> {
  const query = buildQuery({
    search: options.search?.trim(),
    status: options.status ?? 'ACTIVE',
    country: options.country?.trim(),
    companyId: options.companyId,
    page: options.page ?? 1,
    perPage: options.perPage ?? 50,
  });
  return apiFetch<Paginated<Location>>(`/locations${query}`);
}

export function createLocation(input: CreateLocationInput): Promise<Location> {
  return apiFetch<Location>('/locations', { method: 'POST', body: input });
}

export function getLocation(id: string): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`);
}

export function updateLocation(id: string, input: LocationInput): Promise<Location> {
  return apiFetch<Location>(`/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

/** Load every active Company for a selector, requesting the largest supported page. */
export async function getActiveCompanies(): Promise<Company[]> {
  const perPage = 100 as const;
  const firstPage = await apiFetch<Paginated<Company>>(
    `/companies${buildQuery({ status: 'ACTIVE', page: 1, perPage })}`,
  );
  if (firstPage.data.length >= firstPage.total) return firstPage.data;

  const pageCount = Math.ceil(firstPage.total / perPage);
  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      apiFetch<Paginated<Company>>(
        `/companies${buildQuery({ status: 'ACTIVE', page: index + 2, perPage })}`,
      ),
    ),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.data);
}
