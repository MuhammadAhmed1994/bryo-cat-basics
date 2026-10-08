/** ISO-8601 timestamp returned by the API for a UTC audit timestamp. */
export type UtcTimestamp = string;

/** Location fields returned by create, list, and retrieve operations. */
export interface Location {
  id: string;
  name: string;
  phone: string | null;
  companyId: string | null;
  country: string;
  stateProvince: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: UtcTimestamp;
  updatedAt: UtcTimestamp;
  createdById: string | null;
  updatedById: string | null;
}

/** Input for creating a location. Optional API fields may explicitly be null. */
export interface CreateLocationInput {
  name: string;
  phone?: string | null;
  companyId?: string | null;
  country: string;
  stateProvince?: string | null;
  city?: string | null;
}

/** Partial input for updating a location. */
export type UpdateLocationInput = Partial<CreateLocationInput>;

export type LocationListStatus = 'ACTIVE' | 'INACTIVE' | 'ALL';
export type LocationSortDirection = 'ASC' | 'DESC';

/** Supported query parameters for the paginated locations endpoint. */
export interface LocationListParams {
  search?: string;
  status?: LocationListStatus;
  country?: string;
  companyId?: string;
  page?: number;
  perPage?: number;
  sortDir?: LocationSortDirection;
}

export interface PaginatedLocations {
  data: Location[];
  total: number;
  page: number;
  perPage: number;
}

/** Body accepted by the location status endpoint. */
export interface SetLocationStatusInput {
  isActive: boolean;
}

/** Mutation endpoints return the location along with their API success message. */
export interface LocationMutationResponse extends Location {
  message: string;
}

/** Reference endpoints return name lists from the offline geographic dataset. */
export type LocationCountriesReferenceData = string[];
export type LocationStatesReferenceData = string[];
export type LocationCitiesReferenceData = string[];
