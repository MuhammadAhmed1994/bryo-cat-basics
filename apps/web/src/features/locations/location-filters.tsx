'use client';

import { LocationStatus } from './location-api';

export type LocationStatusFilter = LocationStatus | 'ALL';

export interface LocationFilterDraft {
  status: LocationStatusFilter;
  country: string;
  companyId: string;
}

interface LocationFiltersProps {
  draft: LocationFilterDraft;
  countries: string[];
  companies: Array<{ id: string; name: string }>;
  onDraftChange: (draft: LocationFilterDraft) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationFilters({
  draft,
  countries,
  companies,
  onDraftChange,
  onApply,
  onReset,
}: LocationFiltersProps) {
  return (
    <form
      aria-label="Location filters"
      className="grid grid-cols-1 items-end gap-4 border-b border-line px-4 pb-4 md:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <label className="flex min-w-0 flex-col gap-1.5 text-sm text-ink-soft">
        Status
        <select
          id="location-status-filter"
          aria-label="Status"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          value={draft.status}
          onChange={(event) => onDraftChange({ ...draft, status: event.target.value as LocationStatusFilter })}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1.5 text-sm text-ink-soft">
        Country
        <select
          id="location-country-filter"
          aria-label="Country"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          value={draft.country}
          onChange={(event) => onDraftChange({ ...draft, country: event.target.value })}
        >
          <option value="">All countries</option>
          {countries.map((country) => <option key={country} value={country}>{country}</option>)}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1.5 text-sm text-ink-soft">
        Company
        <select
          id="location-company-filter"
          aria-label="Company"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          value={draft.companyId}
          onChange={(event) => onDraftChange({ ...draft, companyId: event.target.value })}
        >
          <option value="">All companies</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-3 pb-0.5">
        <button type="submit" className="btn btn--primary">Apply</button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>Reset Filters</button>
      </div>
    </form>
  );
}
