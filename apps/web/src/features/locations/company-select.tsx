"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Company, Paginated } from "@/lib/types";

interface CompanySelectProps {
  id: string;
  value: string | null;
  /**
   * When editing, the stored company might be inactive; pass the current label
   * and active flag so the input can show it even if it won't come back from
   * the active-only search API.
   */
  selectedLabel?: string;
  selectedIsActive?: boolean;
  onChange: (companyId: string | null) => void;
}

export function CompanySelect({ id, value, selectedLabel, selectedIsActive, onChange }: CompanySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch active companies only on open/typing.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = buildQuery({ status: 'ACTIVE', search: search.trim() || undefined, perPage: 50 });
        const page = await apiFetch<Paginated<Company>>(`/companies${query}`);
        // Guard: even if the API were to return inactive records, filter them out here.
        const activeOnly = page.data.filter((c) => c.isActive);
        if (!cancelled) setOptions(activeOnly);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'We could not load companies.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, search]);

  // Build the final list: the stored inactive company is injected as a one-off.
  const finalOptions = useMemo(() => {
    if (value && selectedLabel && selectedIsActive === false) {
      const exists = options.some((c) => c.id === value);
      const injected: Company = {
        id: value,
        name: `${selectedLabel} (inactive)`,
        phone: '',
        email: null,
        website: null,
        billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
        shippingSameAsBilling: true,
        shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
        isActive: false,
        createdAt: '',
        updatedAt: '',
        createdById: null,
        updatedById: null,
      };
      return exists ? options : [injected, ...options];
    }
    return options;
  }, [options, value, selectedLabel, selectedIsActive]);

  function select(id: string | null) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        placeholder="Search companies"
        value={open ? search : value ? (selectedIsActive === false && selectedLabel ? `${selectedLabel} (inactive)` : selectedLabel ?? '') : search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
        }}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-white shadow-menu" role="dialog">
          <ul id={`${id}-listbox`} role="listbox" className="max-h-60 overflow-auto py-1 text-sm">
            <li role="option" className="cursor-pointer px-3 py-2 hover:bg-light" onClick={() => select(null)}>
              None
            </li>
            {loading && <li className="px-3 py-2 text-ink-soft">Searching…</li>}
            {error && <li className="px-3 py-2 text-destructive">{error}</li>}
            {!loading && !error && finalOptions.map((c) => (
              <li
                key={c.id}
                role="option"
                aria-selected={value === c.id}
                className={`cursor-pointer px-3 py-2 hover:bg-light ${value === c.id ? 'bg-light text-brand' : ''}`}
                onClick={() => select(c.id)}
              >
                {c.name}
              </li>
            ))}
            {!loading && !error && finalOptions.length === 0 && (
              <li className="px-3 py-2 text-ink-soft">No companies</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
