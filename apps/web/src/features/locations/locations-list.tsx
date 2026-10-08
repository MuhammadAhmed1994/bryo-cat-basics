'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { FilterIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Location, listLocations } from './locations-api';
import { LocationTable } from './location-table';
import { LocationFilterValues, LocationFilters } from './location-filters';

interface ListState extends LocationFilterValues {
  search: string;
  page: number;
  perPage: 25 | 50 | 100;
}

const DEFAULT_STATE: ListState = {
  search: '',
  status: 'ACTIVE',
  country: '',
  companyId: '',
  page: 1,
  perPage: 50,
};

function appliedCount(state: ListState): number {
  return (state.status === 'ALL' ? 0 : 1) + Number(Boolean(state.country.trim())) + Number(Boolean(state.companyId));
}

export function LocationsList() {
  const [state, setState] = useState<ListState>(DEFAULT_STATE);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<Location> | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [locations, activeCompanies] = await Promise.all([
        listLocations({
          search: state.search,
          status: state.status,
          country: state.country,
          companyId: state.companyId || undefined,
          page: state.page,
          perPage: state.perPage,
        }),
        apiFetch<Paginated<Company>>('/companies?status=ACTIVE&sortDir=ASC&page=1&perPage=100'),
      ]);
      setResult(locations);
      setCompanies(activeCompanies.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => { void load(); }, [load]);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = searchInput.trim();
    setSearchInput(search);
    setState((previous) => ({ ...previous, search, page: 1 }));
  }

  function updateFilters(values: LocationFilterValues) {
    setState((previous) => ({ ...previous, ...values, page: 1 }));
  }

  function reset() {
    setSearchInput('');
    setState({ ...DEFAULT_STATE });
  }

  const hasSearchOrAdditionalFilters = Boolean(state.search || state.country.trim() || state.companyId);
  const isEmpty = Boolean(result && result.total === 0 && !hasSearchOrAdditionalFilters && state.status === 'ACTIVE');
  const filters = { status: state.status, country: state.country, companyId: state.companyId };
  const count = appliedCount(state);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-brand" aria-hidden="true">
            <LocationIcon />
          </span>
          <div>
            <h1 className="text-[28px] font-semibold leading-9 text-ink">Locations</h1>
            <p className="mt-1 text-sm text-ink-soft">Manage the places your teams operate.</p>
          </div>
        </div>
        <Link className="btn btn--primary rounded-lg" href="/locations/new"><PlusIcon />Add Location</Link>
      </section>

      <section className="card overflow-hidden" aria-label="Location list">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-6 py-5">
          <form onSubmit={applySearch} role="search" className="relative w-full max-w-sm">
            <label htmlFor="location-search" className="sr-only">Search locations by name</label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"><SearchIcon /></span>
            <input
              id="location-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
            <button type="submit" className="sr-only">Search</button>
          </form>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="location-filter-panel"
            aria-label={`Filters, ${count} applied filters`}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon />Filters
            <span aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-light px-1 text-xs font-semibold text-brand">{count}</span>
            <span className="sr-only" aria-live="polite">{count} filters applied</span>
          </button>
          <button type="button" className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-canvas hover:text-brand" onClick={reset}>Reset</button>
          <div className="w-full">
            <div id="location-filter-panel">
              <LocationFilters open={filtersOpen} values={filters} companies={companies} onChange={updateFilters} />
            </div>
            {count > 0 && (
              <p className="mt-3 text-xs text-ink-soft" aria-label={`${count} applied filters`}>
                Applied filters: <span className="ml-1">Status: {state.status === 'ALL' ? 'All statuses' : state.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                {state.country.trim() && <span className="ml-3">Country: {state.country.trim()}</span>}
                {state.companyId && <span className="ml-3">Company: {companies.find((company) => company.id === state.companyId)?.name ?? 'Selected company'}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div><strong className="text-sm font-semibold text-ink">Locations</strong>{result && <span className="ml-2 text-xs text-ink-soft">{result.total} results</span>}</div>
          <span className="text-xs text-ink-soft">Name A–Z</span>
        </div>

        {error && (
          <div className="px-6 pb-5">
            <Banner kind="error">Locations could not be loaded. Try again. <button type="button" className="ml-2 underline" onClick={() => void load()}>Retry</button></Banner>
          </div>
        )}
        {loading && <div className="px-6 pb-5"><Spinner label="Loading Locations" /></div>}
        {!loading && !error && result && result.data.length > 0 && (
          <>
            <LocationTable locations={result.data} />
            <div className="border-t border-line">
              <Pagination
                total={result.total}
                page={result.page}
                perPage={result.perPage}
                onPageChange={(page) => setState((previous) => ({ ...previous, page }))}
                onPerPageChange={(perPage) => setState((previous) => ({ ...previous, perPage: perPage as ListState['perPage'], page: 1 }))}
              />
            </div>
          </>
        )}
        {!loading && !error && result && result.data.length === 0 && isEmpty && (
          <EmptyState
            title="No Locations yet."
            message="Add a Location to see it here."
            action={<Link className="btn btn--primary" href="/locations/new"><PlusIcon />Add Location</Link>}
          />
        )}
        {!loading && !error && result && result.data.length === 0 && !isEmpty && (
          <EmptyState
            title="No Locations match your search."
            message="Try adjusting or resetting your search and filters."
            action={<button type="button" className="btn btn--ghost" onClick={reset}>Reset</button>}
          />
        )}
      </section>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
