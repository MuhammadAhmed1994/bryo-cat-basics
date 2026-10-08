'use client';

import { FilterIcon } from '@/components/icons';
import { LocationStatus } from './location-api';

export type LocationStatusFilter = LocationStatus | 'ALL';

export interface CompanyOption {
  id: string;
  name: string;
}

interface LocationFiltersProps {
  open: boolean;
  onToggle: () => void;
  appliedCount: number;
  status: LocationStatusFilter;
  country: string;
  companyId: string;
  countries: string[];
  companies: CompanyOption[];
  onStatusChange: (status: LocationStatusFilter) => void;
  onCountryChange: (country: string) => void;
  onCompanyChange: (companyId: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationFilters(props: LocationFiltersProps) {
  const {
    open, onToggle, appliedCount, status, country, companyId, countries, companies,
    onStatusChange, onCountryChange, onCompanyChange, onApply, onReset,
  } = props;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="location-filter-panel"
          className="relative inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft hover:bg-canvas"
          onClick={onToggle}
        >
          <FilterIcon />
          Filters
          {appliedCount > 0 && (
            <span className="grid min-w-5 h-5 place-items-center rounded-full bg-brand px-1 text-xs font-semibold text-white" aria-label={`${appliedCount} applied filter${appliedCount === 1 ? '' : 's'}`}>
              {appliedCount}
            </span>
          )}
        </button>
        <span className="text-xs text-ink-muted" aria-live="polite">
          {appliedCount > 0 ? `${appliedCount} applied filter${appliedCount === 1 ? '' : 's'}` : 'No filters applied'}
        </span>
      </div>

      {open && (
        <section id="location-filter-panel" className="card grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Location filters">
          <label className="field">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Status</span>
            <select aria-label="Status" value={status} onChange={(event) => onStatusChange(event.target.value as LocationStatusFilter)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All statuses</option>
            </select>
          </label>
          <label className="field">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Country</span>
            <select aria-label="Country" value={country} onChange={(event) => onCountryChange(event.target.value)}>
              <option value="">All countries</option>
              {countries.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Company</span>
            <select aria-label="Company" value={companyId} onChange={(event) => onCompanyChange(event.target.value)}>
              <option value="">All companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-3 pb-1">
            <button type="button" className="btn btn--primary" onClick={onApply}>Apply</button>
            <button type="button" className="btn btn--ghost" onClick={onReset}>Reset Filters</button>
          </div>
        </section>
      )}
    </>
  );
}
