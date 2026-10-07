'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { FilterIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { Company, Paginated } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { listLocations, Location } from './location-api';
import { LocationFilters, LocationFilterValues } from './location-filters';
import { LocationsTable } from './locations-table';

type ListedLocation = Location & {
  company?: { id?: string; name: string } | null;
  companyName?: string | null;
};

const DEFAULT_FILTERS: LocationFilterValues = {
  status: 'ACTIVE',
  country: '',
  companyId: '',
};
const PAGE_SIZE = 50;

export function LocationsList() {
  const [records, setRecords] = useState<Paginated<Location> | null>(null);
  const [companyOptions, setCompanyOptions] = useState<Company[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [draftFilters, setDraftFilters] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await listLocations({
        search: appliedSearch || undefined,
        status: appliedFilters.status,
        country: appliedFilters.country || undefined,
        companyId: appliedFilters.companyId || undefined,
        sortDir: 'ASC',
        page,
        perPage,
      });
      setRecords(result);
      try {
        const companies = await apiFetch<Paginated<Company>>('/companies?status=ALL&perPage=100');
        setCompanyOptions(companies.data);
      } catch {
        // The location results remain useful if company filter options cannot be loaded.
        setCompanyOptions([]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, appliedSearch, page, perPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const locations = (records?.data ?? []) as ListedLocation[];
  const countries = useMemo(
    () => Array.from(new Set(locations.map((location) => location.country).filter((value): value is string => Boolean(value)))).sort(),
    [locations],
  );
  const companies = useMemo(
    () => companyOptions.map((company) => ({ id: company.id, name: company.name })),
    [companyOptions],
  );
  const companyNames = useMemo(
    () => new Map(companyOptions.map((company) => [company.id, company.name])),
    [companyOptions],
  );
  const rows = locations.map((location) => ({
    ...location,
    companyName: location.company?.name ?? location.companyName ?? (location.companyId ? companyNames.get(location.companyId) : null),
  }));

  const appliedCount =
    (appliedFilters.status !== 'ALL' ? 1 : 0) +
    Number(Boolean(appliedFilters.country)) +
    Number(Boolean(appliedFilters.companyId)) +
    Number(Boolean(appliedSearch));

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(searchValue.trim());
    setPage(1);
  }

  function applyFilters() {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  }

  function resetFilters() {
    setSearchValue('');
    setAppliedSearch('');
    setDraftFilters({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    setPerPage(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places where your teams work.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon /> Add Location
        </Link>
      </section>

      <section className="card overflow-hidden" aria-label="Location list">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <form onSubmit={submitSearch} role="search" className="relative min-w-[220px] flex-1 sm:max-w-md">
            <label className="sr-only" htmlFor="location-search">Search locations</label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"><SearchIcon /></span>
            <input
              id="location-search"
              type="search"
              value={searchValue}
              placeholder="Search by Location name"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <button className="sr-only" type="submit">Search</button>
          </form>
          <button
            className="relative inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-canvas"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="location-filter-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon /> Filters
            <span aria-label={`${appliedCount} applied filters`} className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
              {appliedCount}
            </span>
          </button>
          <span className="ml-auto text-xs text-ink-muted">{appliedCount} applied filter{appliedCount === 1 ? '' : 's'}</span>
        </div>

        {filtersOpen && (
          <div id="location-filter-panel">
            <LocationFilters
              values={draftFilters}
              countries={countries}
              companies={companies}
              onChange={setDraftFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>
        )}

        <div className="flex min-h-12 items-center justify-between gap-3 border-t border-line px-6 text-xs text-ink-soft" aria-live="polite">
          <span><strong className="text-ink">{records?.total ?? 0} locations</strong> found</span>
          <span>Sorted by name A–Z</span>
        </div>

        {error && (
          <div className="px-6 pb-4">
            <Banner kind="error">
              <span>Locations could not be loaded. Try again.</span>{' '}
              <button type="button" className="ml-2 font-semibold underline" onClick={() => void load()}>Retry</button>
            </Banner>
          </div>
        )}

        {loading ? (
          <div className="border-t border-line"><Spinner label="Loading locations" /></div>
        ) : error ? null : rows.length > 0 ? (
          <>
            <LocationsTable locations={rows} />
            <div className="border-t border-line">
              <Pagination
                total={records?.total ?? 0}
                page={records?.page ?? page}
                perPage={records?.perPage ?? perPage}
                onPageChange={setPage}
                onPerPageChange={(size) => { setPerPage(size); setPage(1); }}
              />
            </div>
          </>
        ) : (
          <div className="border-t border-line">
            <EmptyState
              title="No locations found."
              message="No locations found."
              action={appliedCount > 0 ? <button className="btn btn--ghost" onClick={resetFilters}>Reset Filters</button> : undefined}
            />
          </div>
        )}
      </section>
    </div>
  );
}
