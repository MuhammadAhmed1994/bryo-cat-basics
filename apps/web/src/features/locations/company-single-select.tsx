'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, Spinner } from '@/components/ui';

interface CompanySingleSelectProps {
  value: string | null;
  onChange: (companyId: string | null) => void;
  id?: string;
  disabled?: boolean;
}

/** Optional single Company association, populated from all active Company pages. */
export function CompanySingleSelect({
  value,
  onChange,
  id = 'location-company',
  disabled = false,
}: CompanySingleSelectProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    let current = true;

    async function loadActiveCompanies() {
      setLoading(true);
      setError(null);
      try {
        const pageSize = 100;
        let pageNumber = 1;
        let fetchedCount = 0;
        let result: Paginated<Company>;
        const activeCompanies: Company[] = [];

        do {
          result = await apiFetch<Paginated<Company>>(
            `/companies${buildQuery({ status: 'ACTIVE', page: pageNumber, perPage: pageSize })}`,
          );
          fetchedCount += result.data.length;
          activeCompanies.push(...result.data.filter((company) => company.isActive));
          pageNumber += 1;
          // Count the raw page rows rather than active rows: status filtering is
          // requested from the API, but filtering locally should not truncate
          // later pages if an API response contains an inactive row as well.
        } while (result.data.length > 0 && fetchedCount < result.total);

        if (current) setCompanies(activeCompanies);
      } catch (cause) {
        if (current) {
          setError(cause instanceof ApiError ? cause.message : 'We could not load active Companies.');
        }
      } finally {
        if (current) setLoading(false);
      }
    }

    void loadActiveCompanies();
    return () => {
      current = false;
    };
  }, []);

  const selectedCompany = companies.find((company) => company.id === value);
  const isDisabled = disabled || loading || Boolean(error) || companies.length === 0;

  useEffect(() => {
    if (open && companies.length) optionRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex, companies.length]);

  function openOptions(index = 0) {
    if (isDisabled) return;
    setFocusedIndex(index);
    setOpen(true);
  }

  function choose(company: Company) {
    onChange(company.id);
    setOpen(false);
  }

  function moveFocus(direction: 1 | -1) {
    setFocusedIndex((index) => (index + direction + companies.length) % companies.length);
  }

  return (
    <div className="field">
      <label htmlFor={id}>Company <span className="text-ink-muted">(optional)</span></label>
      <div className="relative">
        <button
          id={id}
          type="button"
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-left text-sm focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-muted"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-label="Company (optional)"
          disabled={isDisabled}
          onClick={() => (open ? setOpen(false) : openOptions())}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              if (!open) openOptions(event.key === 'ArrowUp' ? companies.length - 1 : 0);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <span>{selectedCompany?.name ?? (loading ? 'Loading active Companies…' : 'Select a Company')}</span>
          <span className="float-right" aria-hidden="true">⌄</span>
        </button>

        {open && (
          <ul
            id={`${id}-options`}
            role="listbox"
            aria-label="Active Companies"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-menu"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveFocus(event.key === 'ArrowDown' ? 1 : -1);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
              }
            }}
          >
            {companies.map((company, index) => (
              <li
                id={`${id}-option-${index}`}
                key={company.id}
                ref={(element) => { optionRefs.current[index] = element; }}
                role="option"
                aria-selected={company.id === value}
                tabIndex={0}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-canvas focus:bg-canvas focus:outline-none"
                onClick={() => choose(company)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose(company);
                  }
                }}
              >
                {company.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="hint" id={`${id}-help`}>
        {loading ? 'Loading active Companies…' : companies.length === 0 && !error ? 'No active Companies available.' : 'Company is optional.'}
      </p>
      {loading && <Spinner label="Loading active Companies" />}
      {error && <Banner kind="error">{error}</Banner>}
      {selectedCompany && !loading && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-brand-light px-3 py-2 text-sm text-brand">
          <span>Selected: {selectedCompany.name}</span>
          <button
            type="button"
            className="rounded px-2 py-1 underline focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label="Clear Company selection"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
