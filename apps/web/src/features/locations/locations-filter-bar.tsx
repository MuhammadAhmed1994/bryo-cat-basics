"use client";

import { useEffect, useRef } from "react";

export function LocationsFilterBar({
  appliedCount,
  statusDraft,
  onStatusDraftChange,
  countryDraft,
  onCountryDraftChange,
  companyDraft,
  onCompanyDraftChange,
  onApply,
  onReset,
}: {
  appliedCount: number;
  statusDraft: "ALL" | "INACTIVE" | null;
  onStatusDraftChange: (v: "ALL" | "INACTIVE" | null) => void;
  countryDraft: string;
  onCountryDraftChange: (v: string) => void;
  companyDraft: string;
  onCompanyDraftChange: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const liveRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // bump announcement for screen readers when the count changes
    if (liveRef.current) liveRef.current.textContent = `Filters (${appliedCount})`;
  }, [appliedCount]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span aria-live="polite" ref={liveRef} className="text-sm text-ink-soft">
          Filters ({appliedCount})
        </span>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-ink-soft" htmlFor="loc-status-filter">
          Status
        </label>
        <select
          id="loc-status-filter"
          aria-label="Status"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={statusDraft ?? ''}
          onChange={(e) => {
            const val = e.target.value as '' | 'ALL' | 'INACTIVE';
            onStatusDraftChange(val === '' ? null : val);
          }}
        >
          <option value="">Active (default)</option>
          <option value="ALL">All</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-ink-soft" htmlFor="loc-country-filter">
          Country
        </label>
        <input
          id="loc-country-filter"
          placeholder="Country"
          className="w-56 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={countryDraft}
          onChange={(e) => onCountryDraftChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-ink-soft" htmlFor="loc-company-filter">
          Company
        </label>
        <input
          id="loc-company-filter"
          placeholder="Company ID"
          className="w-60 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={companyDraft}
          onChange={(e) => onCompanyDraftChange(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
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
