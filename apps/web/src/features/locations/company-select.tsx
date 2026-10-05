"use client";

import { useEffect, useMemo, useState } from 'react';
import { Field } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

interface CompanySelectProps {
  value: string | null;
  onChange: (id: string | null, company?: { id: string; name: string; isActive: boolean }) => void;
  /** When editing, the stored company (possibly inactive) can be injected here. */
  initialCompany?: { id: string; name: string; isActive: boolean } | null;
  label?: string;
  placeholder?: string;
}

export function CompanySelect({
  value,
  onChange,
  initialCompany = null,
  label = 'Company',
  placeholder = 'Search companies',
}: CompanySelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);

  // Selected label shown in the input.
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const found = options.find((o) => o.id === value) ?? initialCompany ?? null;
    if (!found) return '';
    return `${found.name}${found.isActive ? '' : ' (inactive)'}`;
  }, [value, options, initialCompany]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<Paginated<Company>>(
          `/companies?status=ACTIVE&search=${encodeURIComponent(query)}`,
        );
        // AC-8 — Only active companies are listed.
        const actives = data.data.filter((c) => c.isActive).map((c) => ({
          id: c.id,
          name: c.name,
          isActive: c.isActive,
        }));
        if (!cancelled) setOptions(actives);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  function pick(option: { id: string; name: string; isActive: boolean } | null) {
    setOpen(false);
    if (option) onChange(option.id, option);
    else onChange(null);
  }

  return (
    <div className="relative">
      <Field label={label} htmlFor="company-select">
        <input
          id="company-select"
          role="combobox"
          aria-expanded={open}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        />
      </Field>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-white shadow-menu">
          <ul role="listbox" className="max-h-64 overflow-auto p-1 text-sm">
            <li>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-left hover:bg-canvas"
                onClick={() => pick(null)}
              >
                None
              </button>
            </li>
            {loading && (
              <li className="px-2 py-1.5 text-ink-soft">Searching…</li>
            )}
            {!loading && options.length === 0 && (
              <li className="px-2 py-1.5 text-ink-soft">No companies</li>
            )}
            {!loading &&
              options.map((o) => (
                <li key={o.id} role="option">
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left hover:bg-canvas"
                    onClick={() => pick(o)}
                  >
                    {o.name}
                  </button>
                </li>
              ))}
            {/* When editing, surface the stored inactive one-off (kept selectable). */}
            {!loading && initialCompany && !initialCompany.isActive && value === initialCompany.id && (
              <li role="option">
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left hover:bg-canvas"
                  onClick={() => pick(initialCompany)}
                >
                  {initialCompany.name} (inactive)
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
