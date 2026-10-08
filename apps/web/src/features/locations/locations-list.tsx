'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { FilterIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Location, listLocations, LocationStatusFilter } from './locations-api';
import { LocationFilterValues, LocationFilters } from './location-filters';
import { LocationTable } from './location-table';

const DEFAULT_FILTERS: LocationFilterValues = {
  status: 'ACTIVE',
  country: '',
  companyId: '',
};

export function LocationsList() {
  const [filters, setFilters] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<25 | 50 | 100>(50);
  const [result, setResult] = useState<Paginated<Location> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const locations = await listLocations({
        search,
        status: filters.status,
        country: filters.country,
        companyId: filters.companyId || undefined,
        page,
        perPage,
      });
      setResult(locations);
    } catch (cause) {
      setError(true);
      setResult(null);
      // Consume the error value while keeping a consistent, actionable message.
      if (!(cause instanceof ApiError)) console.error('Unable to load Locations', cause);
    } finally {
      setLoading(false);
    }
  }, [filters, search, page, perPage, retryCount]);

  useEffect(() => {
    void load();
  }, [load]);

  const appliedCount = useMemo(() =>
    (filters.status !== 'ACTIVE' ? 1 : 0) +
    (filters.country.trim() ? 1 : 0) +
    (filters.companyId ? 1 : 0),
  [filters]);

  const companies = result?.data ?? [];
  const hasNoMatches = Boolean(search || appliedCount > 0);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function updateFilters(next: LocationFilterValues) {
    setFilters(next);
    setPage(1);
  }

  function reset() {
    setSearchInput('');
    setSearch('');
    setFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    setPerPage(50);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places your teams operate.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon /> Add Location
        </Link>
      </section>

      <section className="card overflow-hidden" aria-label="Location list">
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={submitSearch} role="search" className="relative min-w-52 flex-1 sm:max-w-sm">
              <label className="sr-only" htmlFor="location-search">Search locations by name</label>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                <SearchIcon />
              </span>
              <input
                id="location-search"
                type="search"
                value={searchInput}
                placeholder="Search by name"
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button className="sr-only" type="submit">Search</button>
            </form>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-label={`Filters, ${appliedCount} applied filters`}
              className="relative inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-soft hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <FilterIcon /> Filters
              <span aria-hidden="true" className="grid min-w-5 h-5 place-items-center rounded-full bg-brand-light px-1 text-xs font-semibold text-brand">
                {appliedCount}
              </span>
            </button>
            <button type="button" className="btn btn--ghost !rounded-lg !px-3 !py-2.5" onClick={reset}>
              Reset
            </button>
          </div>
          {filtersOpen && (
            <LocationFilters
              values={filters}
              locations={companies}
              appliedCount={appliedCount}
              onChange={updateFilters}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <div>
            <strong className="text-sm font-semibold text-ink">Locations</strong>
            {result && <span className="ml-2 text-xs text-ink-soft">{result.total} results</span>}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <span aria-hidden="true" className="text-brand">↑</span> Name A–Z
          </span>
        </div>

        {error && (
          <div className="px-5 pb-4">
            <Banner kind="error">
              <span>Locations could not be loaded. Try again.</span>{' '}
              <button type="button" className="font-semibold underline" onClick={() => setRetryCount((count) => count + 1)}>
                Retry
              </button>
            </Banner>
          </div>
        )}

        {loading && <Spinner label="Loading Locations" />}

        {!loading && !error && result && result.data.length > 0 && (
          <>
            <LocationTable locations={result.data} />
            <div className="border-t border-line">
              <Pagination
                total={result.total}
                page={result.page}
                perPage={result.perPage}
                onPageChange={setPage}
                onPerPageChange={(size) => {
                  setPerPage(size as 25 | 50 | 100);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}

        {!loading && !error && result && result.data.length === 0 && hasNoMatches && (
          <EmptyState
            title="No Locations found"
            message="No Locations match your search."
            action={<button type="button" className="btn btn--ghost" onClick={reset}>Reset</button>}
          />
        )}

        {!loading && !error && result && result.data.length === 0 && !hasNoMatches && (
          <EmptyState
            title="No Locations yet."
            message="Add a Location to see it in this list."
            action={<Link className="btn btn--primary" href="/locations/new"><PlusIcon /> Add Location</Link>}
          />
        )}
      </section>
    </div>
  );
}
