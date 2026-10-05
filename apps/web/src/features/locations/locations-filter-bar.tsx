"use client";

import { useId } from "react";
import { ChevronDownIcon, FilterIcon } from "@/components/icons";
import type { StatusFilter } from "@/app/(app)/locations/page";

export interface LocationsFilterDraft {
  status: StatusFilter;
  country: string;
  company: string; // company id
}

interface LocationsFilterBarProps {
  value: LocationsFilterDraft;
  onChange: (next: LocationsFilterDraft) => void;
  appliedCount: number;
  onApply: () => void;
  onReset: () => void;
}

export function LocationsFilterBar({ value, onChange, appliedCount, onApply, onReset }: LocationsFilterBarProps) {
  const statusId = useId();
  const countryId = useId();
  const companyId = useId();

  return (
    <div className="flex w-full flex-wrap items-end gap-3" aria-label="Filter locations">
      <div className="flex items-center gap-2 pr-1">
        <span className="text-ink-soft"><FilterIcon /></span>
        <span className="text-sm font-semibold text-ink">Filters</span>
        <span aria-live="polite" className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-brand-light px-2 text-xs font-semibold text-brand">
          {appliedCount}
        </span>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-brand" id={`${statusId}-label`}>Status</span>
        <div className="flex items-center gap-2 rounded-lg border border-line px-2 py-2">
          <select
            aria-labelledby={`${statusId}-label`}
            value={value.status}
            className="min-w-[140px] appearance-none bg-transparent text-sm outline-none"
            onChange={(e) => onChange({ ...value, status: e.target.value as StatusFilter })}
          >
            <option value="ACTIVE">Active</option>
            <option value="ALL">All</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <ChevronDownIcon className="text-ink-muted" />
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-brand" id={`${countryId}-label`}>Country</span>
        <input
          id={countryId}
          placeholder="Filter by country"
          className="w-44 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-brand" id={`${companyId}-label`}>Company</span>
        <input
          id={companyId}
          placeholder="Company ID"
          className="w-56 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          value={value.company}
          onChange={(e) => onChange({ ...value, company: e.target.value })}
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="btn btn--primary" onClick={onApply}>Apply</button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>Reset Filters</button>
      </div>
    </div>
  );
}
