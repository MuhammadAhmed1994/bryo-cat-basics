'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { FilterIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { CompaniesTable } from './companies-table';

type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

/**
 * Spec 2.8.7 — list with search, status chips, country filter, sort and
 * pagination. Filters and sort are kept in sessionStorage so returning from a
 * record restores the view (spec 2.8.7, "Search, Filter, and Sorting Retention").
 */
const VIEW_KEY = 'nbryo.companies.view';

interface View {
  search: string;
  status: StatusFilter;
  country: string;
  sortDir: 'ASC' | 'DESC';
  page: number;
  perPage: number;
}

const DEFAULT_VIEW: View = {
  search: '',
  status: 'ACTIVE',
  country: '',
  sortDir: 'ASC',
  page: 1,
  perPage: 25,
};

function loadView(): View {
  if (typeof window === 'undefined') return DEFAULT_VIEW;
  try {
    const raw = window.sessionStorage.getItem(VIEW_KEY);
    return raw ? { ...DEFAULT_VIEW, ...(JSON.parse(raw) as Partial<View>) } : DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
  }
}

export function CompaniesList() {
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<Company> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Distinguishes "no records at all" from "nothing matched" (spec 2.8.7). */
  const [moduleIsEmpty, setModuleIsEmpty] = useState(false);

  useEffect(() => {
    const restored = loadView();
    setView(restored);
    setSearchInput(restored.search);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(VIEW_KEY, JSON.stringify(view));
    }
  }, [view]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        search: view.search || undefined,
        status: view.status,
        country: view.country || undefined,
        sortDir: view.sortDir,
        page: view.page,
        perPage: view.perPage,
      });
      const page = await apiFetch<Paginated<Company>>(`/companies${query}`);
      setResult(page);

      if (page.total === 0 && (view.search || view.country || view.status !== 'ACTIVE')) {
        // Something is filtered out — check whether the module itself is empty.
        const unfiltered = await apiFetch<Paginated<Company>>('/companies?status=ALL&perPage=25');
        setModuleIsEmpty(unfiltered.total === 0);
      } else {
        setModuleIsEmpty(page.total === 0);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not load companies.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  // Spec 2.8.7 — count how many filters are active so the UI can show it.
  const activeFilterCount = (view.status !== 'ACTIVE' ? 1 : 0) + (view.country ? 1 : 0);

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    setView((v) => ({ ...v, search: searchInput.trim(), page: 1 }));
  }

  function resetFilters() {
    setSearchInput('');
    setView({ ...DEFAULT_VIEW });
  }

  const hasRecords = (result?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">
            Companies{result ? ` (${result.total})` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Click on the &ldquo;Add Company&rdquo; button to add new Companies.
          </p>
        </div>
        <Link className="btn btn--primary" href="/companies/new">
          <PlusIcon />
          Add Company
        </Link>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 px-7 py-4">
        <p className="m-0 text-sm text-ink-soft">
          Use the search box to find specific companies.
        </p>

        <div className="flex items-center gap-2">
          <form onSubmit={applySearch} role="search" className="relative">
            <label className="sr-only" htmlFor="company-search">
              Search companies
            </label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              <SearchIcon />
            </span>
            <input
              id="company-search"
              value={searchInput}
              placeholder="Search"
              className="w-72 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>

          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-label="Filters"
            className="relative rounded-lg border border-line p-2.5 text-ink-soft hover:bg-canvas"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {filtersOpen && (
        <section className="card flex flex-wrap items-center gap-4 px-7 py-4">
          {/* Spec 2.8.7 — status chip buttons. */}
          <div
            className="inline-flex rounded-full border border-line p-0.5"
            role="group"
            aria-label="Status filter"
          >
            {(['ACTIVE', 'INACTIVE', 'ALL'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={view.status === status}
                className={view.status === status ? 'chip chip--on' : 'chip'}
                onClick={() => setView((v) => ({ ...v, status, page: 1 }))}
              >
                {status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : 'All'}
              </button>
            ))}
          </div>

          <input
            value={view.country}
            placeholder="Filter by country"
            aria-label="Filter by country"
            className="w-56 rounded-lg border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            onChange={(event) => setView((v) => ({ ...v, country: event.target.value, page: 1 }))}
          />

          {activeFilterCount > 0 && (
            <span className="text-sm text-ink-soft">{activeFilterCount} filter(s) applied</span>
          )}

          <button type="button" className="btn btn--ghost ml-auto" onClick={resetFilters}>
            Reset Filters
          </button>
        </section>
      )}

      {error && <Banner kind="error">{error}</Banner>}

      {loading && (
        <section className="card">
          <Spinner label="Loading companies" />
        </section>
      )}

      {!loading && hasRecords && result && (
        <section className="card overflow-hidden">
          <CompaniesTable
            companies={result.data}
            sortDir={view.sortDir}
            onToggleSort={() =>
              setView((v) => ({ ...v, sortDir: v.sortDir === 'ASC' ? 'DESC' : 'ASC' }))
            }
          />
          <div className="border-t border-line">
            <Pagination
              total={result.total}
              page={result.page}
              perPage={result.perPage}
              onPageChange={(page) => setView((v) => ({ ...v, page }))}
              onPerPageChange={(perPage) => setView((v) => ({ ...v, perPage, page: 1 }))}
            />
          </div>
        </section>
      )}

      {/* Spec 2.8.7 — blank-screen state versus no-matching-records state. */}
      {!loading && !hasRecords && moduleIsEmpty && (
        <EmptyState
          title="No companies"
          message="Add companies to see them here."
          action={
            <Link className="btn btn--primary" href="/companies/new">
              <PlusIcon />
              Add Company
            </Link>
          }
        />
      )}

      {!loading && !hasRecords && !moduleIsEmpty && (
        <EmptyState
          title="No Companies Match Your Criteria"
          message="No companies match your search criteria or selected filters. Refine your search or clear your filters to view available records."
          action={
            <button type="button" className="btn btn--ghost" onClick={resetFilters}>
              Reset Filters
            </button>
          }
        />
      )}
    </div>
  );
}
