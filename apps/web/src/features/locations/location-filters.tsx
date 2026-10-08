'use client';

import { Location, LocationStatusFilter } from './locations-api';

export interface LocationFilterValues {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

interface LocationFiltersProps {
  values: LocationFilterValues;
  locations: Location[];
  appliedCount: number;
  onChange: (values: LocationFilterValues) => void;
}

export function LocationFilters({ values, locations, appliedCount, onChange }: LocationFiltersProps) {
  const companies = Array.from(
    new Map(
      locations
        .filter((location) => location.company)
        .map((location) => [location.company!.id, location.company!.name]),
    ),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-line pt-4" aria-label="Location filters">
      <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-ink-soft">
        Status
        <select
          aria-label="Filter by status"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          value={values.status}
          onChange={(event) => onChange({ ...values, status: event.target.value as LocationStatusFilter })}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-ink-soft">
        Country
        <input
          aria-label="Filter by country"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
          value={values.country}
          placeholder="Any country"
          onChange={(event) => onChange({ ...values, country: event.target.value })}
        />
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-ink-soft">
        Company
        <select
          aria-label="Filter by company"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          value={values.companyId}
          onChange={(event) => onChange({ ...values, companyId: event.target.value })}
        >
          <option value="">All companies</option>
          {companies.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <p className="m-0 text-sm text-ink-soft" aria-live="polite">
        {appliedCount} {appliedCount === 1 ? 'filter' : 'filters'} applied
      </p>
    </div>
  );
}
