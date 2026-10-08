'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { FilterIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { LocationTable } from './location-table';
import { LocationFilters, type LocationFilterValues } from './location-filters';
import { listLocations, type Location } from './locations-api';
import type { Paginated } from '@/lib/types';

const DEFAULT_FILTERS: LocationFilterValues = {
  status: 'ACTIVE',
  country: '',
  companyId: '',
};

type PageSize = 25 | 50 | 100;

export function LocationsList() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [result, setResult] = useState<Paginated<Location> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    void listLocations({
      search,
      status: filters.status,
      country: filters.country || undefined,
      companyId: filters.companyId || undefined,
      sortDir: 'ASC',
      page: pageNumber,
      perPage: pageSize,
    }).then((response) => {
      if (current) setResult(response);
    }).catch(() => {
      if (current) setError(true);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [search, filters, pageNumber, pageSize, retry]);

  const appliedCount = (filters.status !== 'ACTIVE' ? 1 : 0)
    + (filters.country.trim() ? 1 : 0)
    + (filters.companyId ? 1 : 0);

  const countries = useMemo(() => [...new Set(
    (result?.data ?? []).map((location) => location.country?.trim()).filter((country): country is string => Boolean(country)),
  )].sort((a, b) => a.localeCompare(b)), [result]);

  const companies = useMemo(() => {
    const byId = new Map<string, string>();
    for (const location of result?.data ?? []) {
      if (location.companyId && location.company?.name) byId.set(location.companyId, location.company.name);
    }
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [result]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPageNumber(1);
  }

  function reset() {
    setSearchInput('');
    setSearch('');
    setFilters({ ...DEFAULT_FILTERS });
    setPageNumber(1);
    setPageSize(50);
  }

  const hasLocations = Boolean(result?.data.length);
  const noCriteriaMatches = Boolean(search || filters.country.trim() || filters.companyId || filters.status !== 'ACTIVE');

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-white px-6 py-5 shadow-card">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places your teams operate.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon /> Add Location
        </Link>
      </header>

      <section className="card px-6 py-4" aria-label="Location list controls">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={submitSearch} role="search" className="relative min-w-56 flex-1 sm:max-w-md">
            <label className="sr-only" htmlFor="location-search">Search locations by name</label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              <SearchIcon />
            </span>
            <input
              id="location-search"
              type="search"
              value={searchInput}
              placeholder="Search by name"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="sr-only">Search</button>
          </form>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="location-filter-panel"
            aria-label={`Filters, ${appliedCount} applied filters`}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon /> Filters
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink" aria-hidden="true">{appliedCount}</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset}>Reset</button>
          <span className="sr-only" aria-live="polite">{appliedCount} filters applied</span>
        </div>
      </section>

      {filtersOpen && (
        <div id="location-filter-panel">
          <LocationFilters
            values={filters}
            countries={countries}
            companies={companies}
            appliedCount={appliedCount}
            onChange={(values) => { setFilters(values); setPageNumber(1); }}
            onReset={reset}
          />
        </div>
      )}

      <section className="card overflow-hidden" aria-label="Location results">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
          <div>
            <strong className="text-sm font-semibold text-ink">Locations</strong>
            {!loading && result && <span className="ml-2 text-sm text-ink-soft">{result.total} results</span>}
          </div>
          <span className="text-xs text-ink-soft">Name A–Z · {pageSize} per page</span>
        </div>

        {loading && <Spinner label="Loading Locations" />}
        {!loading && error && (
          <div className="space-y-3 px-6 pb-6">
            <Banner kind="error">Locations could not be loaded. Try again.</Banner>
            <button type="button" className="btn btn--ghost" onClick={() => setRetry((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}
        {!loading && !error && hasLocations && result && (
          <>
            <LocationTable locations={result.data} />
            <div className="border-t border-line">
              <Pagination
                total={result.total}
                page={result.page}
                perPage={result.perPage}
                onPageChange={setPageNumber}
                onPerPageChange={(size) => { setPageSize(size as PageSize); setPageNumber(1); }}
              />
            </div>
          </>
        )}
        {!loading && !error && !hasLocations && !noCriteriaMatches && (
          <EmptyState
            title="No Locations yet."
            message="Add a Location to see it here."
            action={<Link className="btn btn--primary" href="/locations/new"><PlusIcon /> Add Location</Link>}
          />
        )}
        {!loading && !error && !hasLocations && noCriteriaMatches && (
          <EmptyState title="No Locations match your search." message="Try adjusting your search or filters, or reset the list to see Active Locations." action={<button type="button" className="btn btn--ghost" onClick={reset}>Reset</button>} />
        )}
      </section>
    </div>
  );
}
