export type UserRole = 'ADMIN' | 'FIELD_TECH' | 'LAB_TECH';
export type UserStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  status: UserStatus;
}

export interface Address {
  line1: string | null;
  line2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
}

export interface Company {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  website: string | null;
  billingAddress: Address;
  shippingSameAsBilling: boolean;
  shippingAddress: Address;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  updatedById: string | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  FIELD_TECH: 'Field Tech',
  LAB_TECH: 'Lab Tech',
};
