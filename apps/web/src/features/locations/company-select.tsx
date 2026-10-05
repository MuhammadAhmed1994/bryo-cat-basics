"use client";

import { useEffect, useMemo, useState } from "react";
import { Field } from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import { Company, Paginated } from "@/lib/types";

export interface CompanyOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface CompanySelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /**
   * When editing a Location the stored company may be inactive. Pass it here
   * so the control can show it as a one-off option labelled “(inactive)”.
   */
  initialOption?: CompanyOption | null;
}

export function CompanySelect({ value, onChange, initialOption = null }: CompanySelectProps) {
  const [options, setOptions] = useState<CompanyOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Only active companies are listed (AC-8). The API already defaults to
    // active-only but we also filter defensively below.
    apiFetch<Paginated<Company>>("/companies")
      .then((page) => {
        if (!mounted) return;
        const activeOnly: CompanyOption[] = page.data
          .filter((c) => c.isActive)
          .map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }));
        setOptions(activeOnly);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "We could not load companies."),
      );
    return () => {
      mounted = false;
    };
  }, []);

  const mergedOptions = useMemo(() => {
    // Include the stored inactive company as a one-off (AC-8/Q-5), but keep the
    // rest of the list active-only.
    if (initialOption && !initialOption.isActive) {
      const exists = options.some((o) => o.id === initialOption.id);
      return exists ? options : [initialOption, ...options];
    }
    return options;
  }, [options, initialOption]);

  const selected = value ?? "";

  return (
    <Field label="Company" htmlFor="company" hint={error ?? undefined}>
      <select
        id="company"
        value={selected}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Company"
      >
        <option value="">None</option>
        {mergedOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
            {!opt.isActive ? " (inactive)" : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}
