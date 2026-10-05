"use client";

export type StatusOption = "ALL" | "ACTIVE" | "INACTIVE";

export interface LocationsFilterValues {
  status: StatusOption;
  country: string;
  company: string; // company id
}

export function LocationsFilterBar({
  values,
  appliedCount,
  onChange,
  onApply,
  onReset,
}: {
  values: LocationsFilterValues;
  appliedCount: number;
  onChange: (values: Partial<LocationsFilterValues>) => void;
  onApply: (values: LocationsFilterValues) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div aria-live="polite" className="text-sm text-ink-soft" id="filters-label">
        Filters ({appliedCount})
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status-filter" className="text-xs font-medium text-ink-soft">
          Status
        </label>
        <select
          id="status-filter"
          aria-label="Status"
          value={values.status}
          className="w-44 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          onChange={(e) => onChange({ status: e.target.value as StatusOption })}
        >
          <option value="ACTIVE">Active</option>
          <option value="ALL">All</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="country-filter" className="text-xs font-medium text-ink-soft">
          Country
        </label>
        <input
          id="country-filter"
          aria-label="Country"
          value={values.country}
          placeholder="Country"
          className="w-56 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          onChange={(e) => onChange({ country: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="company-filter" className="text-xs font-medium text-ink-soft">
          Company
        </label>
        <input
          id="company-filter"
          aria-label="Company"
          value={values.company}
          placeholder="Company"
          className="w-56 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          onChange={(e) => onChange({ company: e.target.value })}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onApply(values)}
          aria-describedby="filters-label"
        >
          Apply
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
