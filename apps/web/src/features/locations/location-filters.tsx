'use client';

import type { LocationStatusFilter } from './locations-api';

export interface LocationFilterValues {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

interface LocationFiltersProps {
  values: LocationFilterValues;
  countries: string[];
  companies: Array<{ id: string; name: string }>;
  appliedCount: number;
  onChange: (values: LocationFilterValues) => void;
  onReset: () => void;
}

export function LocationFilters({
  values,
  countries,
  companies,
  appliedCount,
  onChange,
  onReset,
}: LocationFiltersProps) {
  return (
    <section className="card flex flex-wrap items-end gap-4 px-6 py-4" aria-label="Location filters">
      <label className="flex min-w-40 flex-col gap-1 text-sm font-medium text-ink">
        Status
        <select
          aria-label="Filter by status"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal focus:border-brand focus:outline-none"
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
          list="location-countries"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal focus:border-brand focus:outline-none"
          value={values.country}
          onChange={(event) => onChange({ ...values, country: event.target.value })}
          placeholder="Any country"
        />
        <datalist id="location-countries">
          {countries.map((country) => <option key={country} value={country} />)}
        </datalist>
      </label>

      <label className="flex min-w-48 flex-col gap-1 text-sm font-medium text-ink">
        Company
        <select
          aria-label="Filter by company"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal focus:border-brand focus:outline-none"
          value={values.companyId}
          onChange={(event) => onChange({ ...values, companyId: event.target.value })}
        >
          <option value="">Any company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-ink-soft" aria-live="polite">
          {appliedCount} {appliedCount === 1 ? 'filter' : 'filters'} applied
        </span>
        <button type="button" className="btn btn--ghost" onClick={onReset}>Reset</button>
      </div>
    </section>
  );
}
