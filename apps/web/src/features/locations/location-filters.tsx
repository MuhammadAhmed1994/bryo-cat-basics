'use client';

import { Company } from '@/lib/types';
import { LocationStatusFilter } from './locations-api';

export interface LocationFilterValues {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

interface LocationFiltersProps {
  open: boolean;
  values: LocationFilterValues;
  companies: Company[];
  onChange: (values: LocationFilterValues) => void;
}

export function LocationFilters({ open, values, companies, onChange }: LocationFiltersProps) {
  if (!open) return null;
  return (
    <section className="card flex flex-wrap items-end gap-4 px-6 py-4" aria-label="Location filters">
      <label className="flex min-w-40 flex-col gap-1 text-sm font-medium text-ink">
        Status
        <select
          aria-label="Filter by status"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={values.status}
          onChange={(event) => onChange({ ...values, status: event.target.value as LocationStatusFilter })}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-sm font-medium text-ink">
        Country
        <input
          aria-label="Filter by country"
          className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={values.country}
          placeholder="Any country"
          onChange={(event) => onChange({ ...values, country: event.target.value })}
        />
      </label>
      <label className="flex min-w-48 flex-col gap-1 text-sm font-medium text-ink">
        Company
        <select
          aria-label="Filter by company"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={values.companyId}
          onChange={(event) => onChange({ ...values, companyId: event.target.value })}
        >
          <option value="">All companies</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
      </label>
    </section>
  );
}
