'use client';

import { FormEvent } from 'react';

export type LocationStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export interface LocationFilterValues {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface LocationFiltersProps {
  values: LocationFilterValues;
  countries: string[];
  companies: CompanyOption[];
  onChange: (values: LocationFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationFilters({
  values,
  countries,
  companies,
  onChange,
  onApply,
  onReset,
}: LocationFiltersProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply();
  }

  return (
    <form onSubmit={submit} aria-label="Location filters" className="grid gap-4 border-t border-line px-6 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft" htmlFor="location-status">
        Status
        <select
          id="location-status"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
          value={values.status}
          onChange={(event) => onChange({ ...values, status: event.target.value as LocationStatusFilter })}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft" htmlFor="location-country">
        Country
        <select
          id="location-country"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
          value={values.country}
          onChange={(event) => onChange({ ...values, country: event.target.value })}
        >
          <option value="">All countries</option>
          {countries.map((country) => <option key={country} value={country}>{country}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft" htmlFor="location-company">
        Company
        <select
          id="location-company"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
          value={values.companyId}
          onChange={(event) => onChange({ ...values, companyId: event.target.value })}
        >
          <option value="">All companies</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-4">
        <button className="btn btn--primary" type="submit">Apply</button>
        <button className="text-sm font-medium text-ink-soft hover:text-ink" type="button" onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </form>
  );
}
