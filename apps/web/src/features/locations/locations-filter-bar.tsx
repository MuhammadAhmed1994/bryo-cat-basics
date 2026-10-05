'use client';

export type StatusDraftOption = '' | 'ALL' | 'INACTIVE';

export interface CompanyOption {
  id: string;
  name: string;
}

interface LocationsFilterBarProps {
  status: StatusDraftOption;
  country: string;
  company: string; // company id
  companies: CompanyOption[];
  appliedCount: number; // counts applied filters only, not the search term
  onStatusChange: (value: StatusDraftOption) => void;
  onCountryChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationsFilterBar({
  status,
  country,
  company,
  companies,
  appliedCount,
  onStatusChange,
  onCountryChange,
  onCompanyChange,
  onApply,
  onReset,
}: LocationsFilterBarProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3" aria-label="Filters">
      <span className="text-sm text-ink-soft">Filters ({appliedCount})</span>

      <label className="ml-2">
        <span className="sr-only">Status</span>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusDraftOption)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="">Status</option>
          <option value="ALL">All</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </label>

      <input
        value={country}
        placeholder="Country"
        aria-label="Country"
        className="w-44 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        onChange={(e) => onCountryChange(e.target.value)}
      />

      <label>
        <span className="sr-only">Company</span>
        <select
          aria-label="Company"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          className="w-56 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="">Company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-3">
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Reset Filters
        </button>
        <button type="button" className="btn btn--primary" onClick={onApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
