'use client';

import { useEffect, useMemo, useState } from 'react';
import { Field, Spinner } from '@/components/ui';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

interface CompanySelectProps {
  value: string | null;
  onChange: (companyId: string | null) => void;
  /**
   * Edit screens supply the stored association so an inactive company may be
   * offered as a one-off option labelled “(inactive)”.
   */
  currentCompany?: { id: string; name: string; isActive: boolean } | null;
  label?: string;
}

export function CompanySelect({ value, onChange, currentCompany = null, label = 'Company' }: CompanySelectProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);

  async function loadCompanies(search: string) {
    setLoading(true);
    setError(null);
    try {
      const list = await apiFetch<Paginated<Company>>(
        `/companies${buildQuery({ search: search || undefined })}`,
      );
      // AC-8 — only active companies belong in the option list.
      setOptions(list.data.filter((c) => c.isActive));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load companies.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void loadCompanies(query);
  }, [open, query]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const hit = options.find((c) => c.id === value);
    if (hit) return hit.name;
    if (currentCompany && currentCompany.id === value) {
      return currentCompany.isActive ? currentCompany.name : `${currentCompany.name} (inactive)`;
    }
    return '';
  }, [value, options, currentCompany]);

  return (
    <Field label={label} htmlFor="company">
      <div className="relative">
        <input
          id="company"
          value={open ? query : selectedLabel}
          placeholder="Search companies…"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onBlur={() => {
            // Leave the selected label visible on blur.
            setOpen(false);
            setQuery('');
          }}
        />
        <div className="absolute left-0 right-0 top-full z-20 mt-1">
          {open && (
            <div className="card max-h-64 overflow-auto border border-line bg-white shadow-menu">
              {loading && <Spinner label="Searching" />}
              {!loading && (
                <ul role="listbox">
                  <li>
                    <button
                      type="button"
                      className="menu-item w-full text-left"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(null);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      None
                    </button>
                  </li>
                  {currentCompany && !currentCompany.isActive && (!options.some((c) => c.id === currentCompany.id)) && (
                    <li>
                      <button
                        type="button"
                        className="menu-item w-full text-left"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onChange(currentCompany.id);
                          setOpen(false);
                          setQuery('');
                        }}
                      >
                        {currentCompany.name} (inactive)
                      </button>
                    </li>
                  )}
                  {options.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="menu-item w-full text-left"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onChange(c.id);
                          setOpen(false);
                          setQuery('');
                        }}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                  {!loading && !error && options.length === 0 && (
                    <li className="px-4 py-3 text-sm text-ink-soft">No companies</li>
                  )}
                  {error && <li className="px-4 py-3 text-sm text-destructive">{error}</li>}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Field>
  );
}
