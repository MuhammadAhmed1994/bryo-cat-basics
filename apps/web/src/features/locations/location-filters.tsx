'use client';

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
  companies: Array<{ id: string; name: string }>;
  appliedCount: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (values: LocationFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationFilters({
  values,
  countries,
  companies,
  appliedCount,
  expanded,
  onToggle,
  onChange,
  onApply,
  onReset,
}: LocationFiltersProps) {
  return (
    <section className="card overflow-hidden" aria-label="Location search and filters">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="location-filter-panel"
          className="relative inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft hover:bg-canvas"
          onClick={onToggle}
        >
          <FilterIcon />
          Filters
          <span
            className="grid min-w-5 h-5 place-items-center rounded-full bg-brand px-1 text-xs font-semibold text-white"
            aria-label={`${appliedCount} applied filters`}
          >
            {appliedCount}
          </span>
        </button>
        <span className="text-xs text-ink-muted">{appliedCount} applied filter{appliedCount === 1 ? '' : 's'}</span>
      </div>
      {expanded && (
        <div id="location-filter-panel" className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="field">
            <span>Status</span>
            <select
              aria-label="Status"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
              value={values.status}
              onChange={(event) => onChange({ ...values, status: event.target.value as LocationStatusFilter })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All statuses</option>
            </select>
          </label>
          <label className="field">
            <span>Country</span>
            <select
              aria-label="Country"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
              value={values.country}
              onChange={(event) => onChange({ ...values, country: event.target.value })}
            >
              <option value="">All countries</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Company</span>
            <select
              aria-label="Company"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
              value={values.companyId}
              onChange={(event) => onChange({ ...values, companyId: event.target.value })}
            >
              <option value="">All companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button type="button" className="btn btn--primary" onClick={onApply}>Apply</button>
            <button type="button" className="btn btn--ghost" onClick={onReset}>Reset Filters</button>
          </div>
        </div>
      )}
    </section>
  );
}
