"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Company, Paginated } from "@/lib/types";

interface Option {
  id: string;
  name: string;
  isActive: boolean;
}

interface CompanySelectProps {
  id: string;
  value: string | null;
  onChange: (id: string | null, option: Option | null) => void;
  /** When editing, the stored company (may be inactive). */
  initialOption?: Option | null;
}

export function CompanySelect({ id, value, onChange, initialOption = null }: CompanySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The label we show in the input when a value is selected.
  const selectedLabel = useMemo(() => {
    const match = options.find((o) => o.id === value) || initialOption || null;
    if (!match) return "";
    return match.name + (!match.isActive ? " (inactive)" : "");
  }, [options, value, initialOption]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    const query = buildQuery({ status: "ACTIVE", search: search || undefined, perPage: 50 });
    apiFetch<Paginated<Company>>(`/companies${query}`)
      .then((page) => {
        const active = page.data.filter((c) => c.isActive).map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }));
        // Include the stored inactive company as a one-off when applicable.
        const includeStored = initialOption && !initialOption.isActive && !active.some((o) => o.id === initialOption.id);
        setOptions(includeStored ? [initialOption!, ...active] : active);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "We could not load companies."))
      .finally(() => setLoading(false));
  }, [open, search, initialOption]);

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        placeholder="Search companies"
        value={open ? search : selectedLabel}
        onChange={(e) => {
          if (!open) setOpen(true);
          setSearch(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-full"
      />

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-white shadow-menu">
          <ul id={`${id}-listbox`} role="listbox" className="max-h-60 overflow-auto py-1 text-sm">
            <li>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-canvas"
                onClick={() => {
                  onChange(null, null);
                  setOpen(false);
                  setSearch("");
                }}
              >
                None
              </button>
            </li>
            {loading && <li className="px-3 py-2 text-ink-soft">Searching…</li>}
            {error && <li className="px-3 py-2 text-destructive">{error}</li>}
            {!loading && !error &&
              options
                .filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase()))
                .map((o) => (
                  <li key={o.id} role="option" aria-selected={value === o.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-light hover:text-brand"
                      onClick={() => {
                        onChange(o.id, o);
                        setOpen(false);
                        setSearch("");
                        inputRef.current?.blur();
                      }}
                    >
                      {o.name}
                      {!o.isActive && " (inactive)"}
                    </button>
                  </li>
                ))}
            {!loading && !error && options.length === 0 && (
              <li className="px-3 py-2 text-ink-soft">No companies</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
