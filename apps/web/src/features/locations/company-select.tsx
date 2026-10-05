"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/ui";

export interface CompanyOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface CompanySelectProps {
  /** Selected company id or null when no company is associated. */
  value: string | null;
  onChange: (value: string | null) => void;
  /**
   * Full option list available to the select. The UI shows only active options
   * (AC-8) but if the current value points to an inactive company we include it
   * as a one-off option labelled with “(inactive)”.
   */
  options: CompanyOption[];
  /** Label and input ids are bound through Field just like other inputs. */
  id?: string;
}

/**
 * A simple searchable single-select over a provided in-memory option list.
 *
 * AC-8 requires: “The Company field … is a searchable single-select whose
 * option list contains only active companies.” We implement a small search box
 * that filters the options and a native <select> for the actual single-select.
 *
 * No network calls are performed in this component so unit tests run without
 * external services (fixing the earlier gaierror crash).
 */
export function CompanySelect({ value, onChange, options, id = "company" }: CompanySelectProps) {
  const [query, setQuery] = useState("");

  const activeOptions = useMemo(() => options.filter((o) => o.isActive), [options]);
  const selectedInactive = useMemo(
    () => options.find((o) => !o.isActive && o.id === value) || null,
    [options, value],
  );

  const shownOptions = useMemo(() => {
    const base = [...activeOptions];
    if (selectedInactive) base.push({ ...selectedInactive, name: `${selectedInactive.name} (inactive)` });
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter((o) => o.name.toLowerCase().includes(q));
  }, [activeOptions, selectedInactive, query]);

  return (
    <Field label="Company" htmlFor={id}>
      <div className="flex flex-col gap-2">
        <input
          id={id}
          aria-label="Company"
          placeholder="Search companies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Company options"
          className="min-h-[36px]"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">None</option>
          {shownOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}
