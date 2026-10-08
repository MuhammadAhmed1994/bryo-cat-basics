'use client';

import { useState } from 'react';
import { LocationStatusFilter } from './locations-api';

export interface LocationFilterValues {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

export interface CompanyOption {
  id: string;
  name: string;
}

interface LocationFiltersProps {
  value: LocationFilterValues;
  companies: CompanyOption[];
  onChange: (value: LocationFilterValues) => void;
}

export function countLocationFilters(value: LocationFilterValues): number {
  return (value.status === 'ALL' ? 0 : 1) + (value.country.trim() ? 1 : 0) + (value.companyId ? 1 : 0);
}

export function LocationFilters({ value, companies, onChange }: LocationFiltersProps) {
  const [open, setOpen] = useState(false);
  const count = countLocationFilters(value);
  const selectedCompany = companies.find((company) => company.id === value.companyId);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Filters, ${count} applied filters`}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-ink-soft hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">☷</span>
        Filters <span aria-live="polite" className="rounded-full bg-brand-light px-1.5 text-xs font-semibold text-brand">{count}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-2 grid min-w-64 gap-3 rounded-card border border-line bg-white p-4 shadow-menu" aria-label="Location filters">
          <label className="grid gap-1 text-sm font-medium text-ink-soft" htmlFor="location-status-filter">
            Status
            <select
              id="location-status-filter"
              value={value.status}
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal text-ink focus:border-brand focus:outline-none"
              onChange={(event) => onChange({ ...value, status: event.target.value as LocationStatusFilter })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All statuses</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-ink-soft" htmlFor="location-country-filter">
            Country
            <input
              id="location-country-filter"
              value={value.country}
              className="rounded-lg border border-line px-3 py-2 font-normal text-ink focus:border-brand focus:outline-none"
              placeholder="Any country"
              onChange={(event) => onChange({ ...value, country: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-ink-soft" htmlFor="location-company-filter">
            Company
            <select
              id="location-company-filter"
              value={value.companyId}
              className="rounded-lg border border-line bg-white px-3 py-2 font-normal text-ink focus:border-brand focus:outline-none"
              onChange={(event) => onChange({ ...value, companyId: event.target.value })}
            >
              <option value="">Any company</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{count} filters applied</span>
      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={`${count} applied filters`}>
        <span className="text-xs font-semibold text-ink-soft">Applied filters</span>
        {value.status !== 'ALL' && <span className="rounded border border-line bg-canvas px-2 py-1 text-xs">Status: {value.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>}
        {value.country.trim() && <span className="rounded border border-line bg-canvas px-2 py-1 text-xs">Country: {value.country.trim()}</span>}
        {selectedCompany && <span className="rounded border border-line bg-canvas px-2 py-1 text-xs">Company: {selectedCompany.name}</span>}
      </div>
    </div>
  );
}
