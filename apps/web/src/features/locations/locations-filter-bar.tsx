"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { FilterIcon } from "@/components/icons";

export type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

interface CompanyOption {
  id: string;
  name: string;
}

interface LocationsFilterBarProps {
  status: StatusFilter;
  country: string;
  company: string; // company id or ""
  appliedCount: number;
  onStatusChange: (value: StatusFilter) => void;
  onCountryChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function LocationsFilterBar({
  status,
  country,
  company,
  appliedCount,
  onStatusChange,
  onCountryChange,
  onCompanyChange,
  onApply,
  onReset,
}: LocationsFilterBarProps) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadingCompanies(true);
      setError(null);
      try {
        // Fetch a reasonable number of active companies for the filter.
        const page = await apiFetch<{ data: CompanyOption[] }>(
          "/companies?status=ACTIVE&perPage=50"
        );
        setCompanies(page.data ?? []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "We could not load companies.");
      } finally {
        setLoadingCompanies(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <FilterIcon />
        <span>Filters ({appliedCount})</span>
        <span className="sr-only" aria-live="polite">{appliedCount} filters applied</span>
      </div>

      <label className="sr-only" htmlFor="status-filter">Status</label>
      <select
        id="status-filter"
        aria-label="Status"
        value={status}
        className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
      >
        <option value="ACTIVE">Active</option>
        <option value="ALL">All</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      <input
        value={country}
        placeholder="Country"
        aria-label="Country"
        className="w-48 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        onChange={(e) => onCountryChange(e.target.value)}
      />

      <label className="sr-only" htmlFor="company-filter">Company</label>
      <select
        id="company-filter"
        aria-label="Company"
        value={company}
        className="w-56 rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        onChange={(e) => onCompanyChange(e.target.value)}
        disabled={loadingCompanies || !!error}
      >
        <option value="">All companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="btn btn--ghost" onClick={onReset}>Reset Filters</button>
        <button type="button" className="btn btn--primary" onClick={onApply}>Apply</button>
      </div>
    </div>
  );
}
