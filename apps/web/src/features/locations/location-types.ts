export type LocationListStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';
export type LocationSortDirection = 'ASC' | 'DESC';

/** A location as returned by the API. Timestamp strings are UTC ISO values. */
export interface Location {
  id: string;
  name: string;
  phone: string | null;
  companyId: string | null;
  country: string;
  stateProvince: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  updatedById: string | null;
}

export interface CreateLocationPayload {
  name: string;
  phone?: string | null;
  companyId?: string | null;
  country: string;
  stateProvince?: string | null;
  city?: string | null;
}

export type UpdateLocationPayload = Partial<CreateLocationPayload>;

export interface SetLocationStatusPayload {
  isActive: boolean;
}

export interface LocationMutationResult extends Location {
  message: string;
}

export type LocationStatusResult = LocationMutationResult;

export interface ListLocationsParams {
  search?: string;
  status?: LocationListStatus;
  country?: string;
  companyId?: string;
  page?: number;
  perPage?: 25 | 50 | 100;
  sortDir?: LocationSortDirection;
}

export interface PaginatedLocations {
  data: Location[];
  total: number;
  page: number;
  perPage: number;
}

/** Reference endpoints return lists of geographic names, not external codes. */
export type CountryReference = string;
export type StateProvinceReference = string;
export type CityReference = string;
export type CountriesReferenceData = CountryReference[];
export type StatesReferenceData = StateProvinceReference[];
export type CitiesReferenceData = CityReference[];
