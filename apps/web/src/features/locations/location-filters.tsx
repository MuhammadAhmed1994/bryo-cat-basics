'use client';

import { FormEvent } from 'react';
import { FilterIcon } from '@/components/icons';

export type LocationStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export interface LocationFilterValues {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

interface LocationFiltersProps {
  values: LocationFilterValues;
  countries: string[];
  companies: { id: string; name: string }[];
  count: number;
  open: boolean;
  onToggle: () => void;
  onChange: (values: LocationFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationFilters({
  values,
  countries,
  companies,
  count,
  open,
  onToggle,
  onChange,
  onApply,
  onReset,
}: LocationFiltersProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply();
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
        <button
          type="button"
          className="btn btn--secondary relative"
          aria-expanded={open}
          aria-controls="location-filter-panel"
          onClick={onToggle}
        >
          <FilterIcon />
          Filters
          <span className="ml-1 inline-grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white" aria-label={`${count} applied filters`}>
            {count}
          </span>
        </button>
        {count > 0 && <span className="text-sm text-ink-soft">{count} applied filter{count === 1 ? '' : 's'}</span>}
      </div>
      {open && (
        <form id="location-filter-panel" aria-label="Location filters" onSubmit={submit} className="flex flex-wrap items-end gap-4 px-6 py-4">
          <label className="field min-w-[150px] flex-1">
            <span>Status</span>
            <select
              aria-label="Status"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              value={values.status}
              onChange={(event) => onChange({ ...values, status: event.target.value as LocationStatusFilter })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All statuses</option>
            </select>
          </label>
          <label className="field min-w-[150px] flex-1">
            <span>Country</span>
            <select
              aria-label="Country"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              value={values.country}
              onChange={(event) => onChange({ ...values, country: event.target.value })}
            >
              <option value="">All countries</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </label>
          <label className="field min-w-[150px] flex-1">
            <span>Company</span>
            <select
              aria-label="Company"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              value={values.companyId}
              onChange={(event) => onChange({ ...values, companyId: event.target.value })}
            >
              <option value="">All companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn btn--primary">Apply</button>
            <button type="button" className="btn btn--ghost" onClick={onReset}>Reset Filters</button>
          </div>
        </form>
      )}
    </section>
  );
}
