"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, buildQuery } from "@/lib/api";
import { Company, Paginated } from "@/lib/types";

export interface CompanySelectProps {
  value: string | null;
  onChange: (next: string | null) => void;
  /**
   * Edit screens pass the stored company (which may now be inactive). When it
   * is inactive it appears as a one-off option labelled "(inactive)".
   */
  initialCompany?: Pick<Company, "id" | "name" | "isActive"> | null;
  placeholder?: string;
}

interface Option {
  id: string;
  name: string;
  isActive: boolean;
  inactiveLabel?: string;
}

export function CompanySelect({ value, onChange, initialCompany = null, placeholder = "Search companies" }: CompanySelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  // The text shown in the input mirrors the current selection when any.
  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const match = options.find((o) => o.id === value);
    if (match) return match.name + (match.inactiveLabel ? " " + match.inactiveLabel : "");
    if (initialCompany && initialCompany.id === value) {
      return initialCompany.name + (initialCompany.isActive ? "" : " (inactive)");
    }
    return "";
  }, [value, options, initialCompany]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Only active companies are listed for search (AC-8).
        const qs = buildQuery({ status: "ACTIVE", search: query || undefined });
        const page = await apiFetch<Paginated<Company>>(`/companies${qs}`);
        const active = page?.data?.filter((c) => c.isActive) ?? [];
        const mapped: Option[] = active.map((c) => ({ id: c.id, name: c.name, isActive: true }));

        // If the stored company is now inactive, inject it as a one-off option.
        if (initialCompany && !initialCompany.isActive) {
          if (!mapped.find((o) => o.id === initialCompany.id)) {
            mapped.unshift({ id: initialCompany.id, name: initialCompany.name, isActive: false, inactiveLabel: "(inactive)" });
          }
        }

        if (!cancelled) setOptions(mapped);
      } catch {
        // Silence network errors in the field — leave only the injected inactive option if any.
        const fallback: Option[] = [];
        if (initialCompany && !initialCompany.isActive) {
          fallback.push({ id: initialCompany.id, name: initialCompany.name, isActive: false, inactiveLabel: "(inactive)" });
        }
        if (!cancelled) setOptions(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query, initialCompany?.id, initialCompany?.name, initialCompany?.isActive]);

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="company-select-listbox"
        placeholder={placeholder}
        value={open ? query : selectedLabel}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {open && (
        <div
          id="company-select-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-line bg-white p-1 shadow-menu"
        >
          <button
            type="button"
            role="option"
            className="w-full cursor-pointer rounded px-2 py-1 text-left text-sm hover:bg-ink-50"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
          >
            None
          </button>

          {loading && (
            <div className="px-2 py-2 text-sm text-ink-soft" role="status">
              Searching…
            </div>
          )}

          {!loading && options.length === 0 && (
            <div className="px-2 py-2 text-sm text-ink-soft">No matches</div>
          )}

          {!loading &&
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                className={`w-full cursor-pointer rounded px-2 py-1 text-left text-sm hover:bg-ink-50 ${
                  value === opt.id ? "bg-ink-50" : ""
                }`}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {opt.name} {opt.inactiveLabel && <span className="text-ink-soft">{opt.inactiveLabel}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
