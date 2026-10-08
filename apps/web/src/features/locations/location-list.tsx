'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, buildQuery, ApiError } from '@/lib/api';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { PlusIcon, SearchIcon } from '@/components/icons';
import { LocationTable, LocationListRow } from './location-table';

interface LocationsResult {
  data: LocationListRow[];
  total: number;
  page: number;
  perPage: number;
}

type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

interface Filters {
  search: string;
  status: StatusFilter;
  country: string;
  companyId: string;
  page: number;
  perPage: number;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  status: 'ACTIVE',
  country: '',
  companyId: '',
  page: 1,
  perPage: 50,
};

export function LocationList() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<LocationsResult | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        search: filters.search || undefined,
        status: filters.status,
        country: filters.country || undefined,
        companyId: filters.companyId || undefined,
        page: filters.page,
        perPage: filters.perPage,
      });
      const response = await apiFetch<LocationsResult>(`/locations${query}`);
      setResult(response);
      setLocationOptions((options) => {
        const rows = new Map(options.map((row) => [row.id, row]));
        response.data.forEach((row) => rows.set(row.id, row));
        return Array.from(rows.values());
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Locations could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  const companies = useMemo(() => {
    const unique = new Map<string, string>();
    locationOptions.forEach((location) => {
      if (location.companyId && location.company && location.company !== '-') {
        unique.set(location.companyId, location.company);
      }
    });
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [locationOptions]);

  const appliedFilterCount =
    (filters.status !== 'ACTIVE' ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.companyId ? 1 : 0);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: searchInput.trim(), page: 1 }));
  }

  function resetFilters() {
    setSearchInput('');
    setFilters({ ...DEFAULT_FILTERS });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">{result ? `${result.total} locations` : 'Manage your locations.'}</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add location
        </Link>
      </section>

      <section className="card flex flex-col gap-4 px-6 py-4" aria-labelledby="location-filters-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="location-filters-title" className="m-0 text-sm font-semibold text-ink">Search and filters</h2>
          <div className="flex items-center gap-4 text-xs text-ink-soft">
            <span>Filters applied <span className="ml-1 inline-grid min-w-5 place-items-center rounded-full bg-canvas px-1.5 py-0.5 font-semibold" aria-label={`${appliedFilterCount} applied filters`}>{appliedFilterCount}</span></span>
            <button type="button" className="font-medium hover:text-ink" onClick={resetFilters}>Reset</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <form onSubmit={submitSearch} role="search" className="md:col-span-1">
            <label htmlFor="location-search" className="mb-1 block text-xs font-medium text-ink-soft">Search locations</label>
            <div className="flex items-center gap-2 rounded-lg border border-line px-3 focus-within:border-brand">
              <SearchIcon />
              <input id="location-search" type="search" value={searchInput} placeholder="Search by location name" className="min-w-0 flex-1 border-0 py-2 text-sm focus:outline-none" onChange={(event) => setSearchInput(event.target.value)} />
              <button type="submit" className="sr-only">Search</button>
            </div>
          </form>
          <div>
            <label htmlFor="location-status" className="mb-1 block text-xs font-medium text-ink-soft">Status</label>
            <select id="location-status" value={filters.status} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as StatusFilter, page: 1 }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All statuses</option>
            </select>
          </div>
          <div>
            <label htmlFor="location-country" className="mb-1 block text-xs font-medium text-ink-soft">Country</label>
            <input id="location-country" value={filters.country} placeholder="All countries" className="w-full rounded-lg border border-line px-3 py-2 text-sm" onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value, page: 1 }))} />
          </div>
          <div>
            <label htmlFor="location-company" className="mb-1 block text-xs font-medium text-ink-soft">Company</label>
            <select id="location-company" value={filters.companyId} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" onChange={(event) => setFilters((current) => ({ ...current, companyId: event.target.value, page: 1 }))}>
              <option value="">All companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </div>
        </div>
        <p className="m-0 text-xs text-ink-muted">Search names; matching ignores case and leading or trailing spaces.</p>
      </section>

      {error && <div className="flex flex-col gap-3"><Banner kind="error">{error}</Banner><button type="button" className="btn btn--ghost self-start" onClick={() => void loadLocations()}>Try again</button></div>}
      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && result && result.data.length > 0 && (
        <section className="card overflow-hidden" aria-labelledby="location-results-title">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 id="location-results-title" className="m-0 text-base font-semibold text-ink">Location results</h2>
            <span className="text-xs text-ink-soft" aria-live="polite">{result.total} results</span>
          </div>
          <LocationTable locations={result.data} />
          <div className="border-t border-line">
            <Pagination total={result.total} page={result.page} perPage={result.perPage} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} onPerPageChange={(perPage) => setFilters((current) => ({ ...current, perPage, page: 1 }))} />
          </div>
        </section>
      )}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="No locations" message="No locations found." action={(filters.search || appliedFilterCount > 0) ? <button type="button" className="btn btn--ghost" onClick={resetFilters}>Reset</button> : undefined} />
      )}
    </div>
  );
}
