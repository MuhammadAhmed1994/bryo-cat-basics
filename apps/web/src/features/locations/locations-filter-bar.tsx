'use client';

export type LocationsFilterValues = {
  // '' means default Active view; 'ALL' and 'INACTIVE' are explicit user choices
  status: '' | 'ALL' | 'INACTIVE';
  country: string;
  company: string;
};

export function LocationsFilterBar({
  values,
  appliedCount,
  onChange,
  onApply,
  onReset,
}: {
  values: LocationsFilterValues;
  appliedCount: number;
  onChange: (values: LocationsFilterValues) => void;
  onApply: (values: LocationsFilterValues) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink" aria-live="polite">
          {`Filters (${appliedCount})`}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink" htmlFor="loc-status">
          <span className="text-ink-soft">Status</span>
          <select
            id="loc-status"
            value={values.status}
            onChange={(e) => onChange({ ...values, status: e.target.value as LocationsFilterValues['status'] })}
            className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Active (default)</option>
            <option value="ALL">All</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink" htmlFor="loc-country">
          <span className="text-ink-soft">Country</span>
          <input
            id="loc-country"
            value={values.country}
            onChange={(e) => onChange({ ...values, country: e.target.value })}
            placeholder="Filter by country"
            className="w-48 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink" htmlFor="loc-company">
          <span className="text-ink-soft">Company</span>
          <input
            id="loc-company"
            value={values.company}
            onChange={(e) => onChange({ ...values, company: e.target.value })}
            placeholder="Filter by company"
            className="w-48 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onApply(values)}
          >
            Apply
          </button>
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
