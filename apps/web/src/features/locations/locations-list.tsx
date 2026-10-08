'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { PlusIcon, SearchIcon } from '@/components/icons';
import { listLocations, Location, LocationListQuery } from './location-api';
import { LocationFilters, LocationFilterValues } from './location-filters';
import { LocationsTable } from './locations-table';

const DEFAULT_FILTERS: LocationFilterValues = { status: 'ACTIVE', country: '', companyId: '' };
const PAGE_SIZE = 50;

/** Get every page independently so filter choices are not limited to current results. */
async function loadFilterCatalog(): Promise<{ locations: Location[]; companies: Company[] }> {
  const [locations, companies] = await Promise.all([
    (async () => {
      const all: Location[] = [];
      let page = 1;
      let total = 0;
      let hasMore = true;
      do {
        const result = await listLocations({ status: 'ALL', page, perPage: 100 });
        all.push(...result.data);
        total = result.total;
        page += 1;
        hasMore = result.data.length > 0;
      } while (all.length < total && hasMore);
      return all;
    })(),
    (async () => {
      const all: Company[] = [];
      let page = 1;
      let total = 0;
      let hasMore = true;
      do {
        const result = await apiFetch<Paginated<Company>>(`/companies${buildQuery({ status: 'ALL', page, perPage: 100 })}`);
        all.push(...result.data);
        total = result.total;
        page += 1;
        hasMore = result.data.length > 0;
      } while (all.length < total && hasMore);
      return all;
    })(),
  ]);
  return { locations, companies };
}

export function LocationsList() {
  const [filters, setFilters] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZE);
  const [result, setResult] = useState<Paginated<Location> | null>(null);
  const [filterLocations, setFilterLocations] = useState<Location[]>([]);
  const [companyChoices, setCompanyChoices] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const query = useMemo<LocationListQuery>(() => ({
    search: search || undefined,
    status: filters.status,
    country: filters.country || undefined,
    companyId: filters.companyId || undefined,
    sortDir: 'ASC',
    page: pageNumber,
    perPage,
  }), [filters, pageNumber, perPage, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, catalog] = await Promise.all([listLocations(query), loadFilterCatalog()]);
      setResult(rows);
      setFilterLocations(catalog.locations);
      setCompanyChoices(catalog.companies);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Locations could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const companyNames = useMemo(() => Object.fromEntries(
    companyChoices.map((company) => [company.id, company.name]),
  ), [companyChoices]);
  const countries = useMemo(() => Array.from(new Set(
    filterLocations.map((location) => location.country).filter((country): country is string => Boolean(country)),
  )).sort((a, b) => a.localeCompare(b)), [filterLocations]);
  const appliedCount = (filters.status !== 'ALL' ? 1 : 0) +
    (filters.country ? 1 : 0) + (filters.companyId ? 1 : 0) + (search ? 1 : 0);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPageNumber(1);
  }

  function applyFilters() {
    setFilters({ ...draftFilters });
    setPageNumber(1);
  }

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS });
    setDraftFilters({ ...DEFAULT_FILTERS });
    setSearch('');
    setSearchInput('');
    setPageNumber(1);
    setPerPage(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places where your teams work.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new"><PlusIcon />Add Location</Link>
      </section>

      <section className="card flex flex-wrap items-center gap-4 px-6 py-4">
        <form onSubmit={applySearch} role="search" className="relative min-w-[240px] flex-1">
          <label className="sr-only" htmlFor="location-search">Search locations</label>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"><SearchIcon /></span>
          <input
            id="location-search"
            type="search"
            value={searchInput}
            placeholder="Search by Location name"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="sr-only">Search</button>
        </form>
      </section>

      <LocationFilters
        values={draftFilters}
        countries={countries}
        companies={companyChoices.map(({ id, name }) => ({ id, name }))}
        count={appliedCount}
        open={filtersOpen}
        onToggle={() => setFiltersOpen((open) => !open)}
        onChange={setDraftFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {error && <Banner kind="error">{error} <button type="button" className="ml-2 underline" onClick={() => void load()}>Try again</button></Banner>}
      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && result && result.data.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 text-sm text-ink-soft" aria-live="polite">
            <span><strong className="text-ink">{result.total} locations</strong> found</span>
            <span>Sorted by name A–Z</span>
          </div>
          <LocationsTable locations={result.data} companyNames={companyNames} />
          <div className="border-t border-line">
            <Pagination
              total={result.total}
              page={result.page}
              perPage={result.perPage}
              onPageChange={setPageNumber}
              onPerPageChange={(size) => { setPerPage(size); setPageNumber(1); }}
            />
          </div>
        </section>
      )}
      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState
          title="No locations found."
          message="Try changing your search or filters."
          action={appliedCount > 0 ? <button type="button" className="btn btn--ghost" onClick={resetFilters}>Reset Filters</button> : undefined}
        />
      )}
    </div>
  );
}
