"use client";

import { useEffect, useState } from "react";

export type StatusDraft = "DEFAULT" | "ALL" | "INACTIVE";

export function LocationsFilterBar({
  status,
  country,
  company,
  onApply,
  onReset,
}: {
  status: "ACTIVE" | "INACTIVE" | "ALL";
  country: string;
  company: string;
  onApply: (values: { status: StatusDraft; country: string; company: string }) => void;
  onReset: () => void;
}) {
  const [localStatus, setLocalStatus] = useState<StatusDraft>(status === "ACTIVE" ? "DEFAULT" : (status as StatusDraft));
  const [localCountry, setLocalCountry] = useState(country);
  const [localCompany, setLocalCompany] = useState(company);

  useEffect(() => {
    setLocalStatus(status === "ACTIVE" ? "DEFAULT" : (status as StatusDraft));
    setLocalCountry(country);
    setLocalCompany(company);
  }, [status, country, company]);

  function apply() {
    onApply({ status: localStatus, country: localCountry.trim(), company: localCompany.trim() });
  }

  function reset() {
    setLocalStatus("DEFAULT");
    setLocalCountry("");
    setLocalCompany("");
    onReset();
  }

  return (
    <div className="flex flex-wrap items-end gap-4" aria-label="Locations filters">
      <div className="field w-44">
        <label htmlFor="status">Status</label>
        <select id="status" value={localStatus} onChange={(e) => setLocalStatus(e.target.value as StatusDraft)}>
          <option value="DEFAULT">Active (default)</option>
          <option value="ALL">All</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="field w-56">
        <label htmlFor="country">Country</label>
        <input id="country" value={localCountry} onChange={(e) => setLocalCountry(e.target.value)} placeholder="e.g. Australia" />
      </div>

      <div className="field w-56">
        <label htmlFor="company">Company</label>
        <input id="company" value={localCompany} onChange={(e) => setLocalCompany(e.target.value)} placeholder="Company ID" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="btn btn--ghost" onClick={reset}>
          Reset Filters
        </button>
        <button type="button" className="btn btn--primary" onClick={apply}>
          Apply
        </button>
      </div>
    </div>
  );
}
