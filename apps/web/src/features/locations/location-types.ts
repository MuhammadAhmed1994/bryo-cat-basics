export interface LocationCompany {
  id: string;
  name: string;
  isActive?: boolean;
}

export type LocationStatus = 'ACTIVE' | 'INACTIVE';

export interface Location {
  id: string;
  name: string;
  phone: string | null;
  contactPersonPhone: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  status: LocationStatus;
  companyId: string | null;
  company?: LocationCompany | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationValues {
  name: string;
  phone: string;
  contactPersonPhone: string;
  country: string;
  stateProvince: string;
  city: string;
  companyId: string | null;
}

export type LocationPayload = Omit<LocationValues, 'phone' | 'contactPersonPhone' | 'country' | 'stateProvince' | 'city'> & {
  phone: string | null;
  contactPersonPhone: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
};

export interface CompanyChoices {
  data: LocationCompany[];
  total?: number;
  page?: number;
  perPage?: number;
}
