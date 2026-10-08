'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { FilterIcon, LocationIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Paginated } from '@/lib/types';
import { listLocations, Location } from './location-api';
import { LocationFilterDraft, LocationFilters } from './location-filters';
import { LocationsTable } from './locations-table';

const DEFAULT_FILTERS: LocationFilterDraft = { status: 'ACTIVE', country: '', companyId: '' };
const DEFAULT_PAGE_SIZE = 50;

export function LocationsList() {
  const [result, setResult] = useState<Paginated<Location> | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<LocationFilterDraft>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<LocationFilterDraft>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLocations({
        search: search || undefined,
        status: applied.status,
        country: applied.country || undefined,
        companyId: applied.companyId || undefined,
        sortDir: 'ASC',
        page,
        perPage,
      });
      setResult(data);
    } catch {
      setError('Locations could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [applied, page, perPage, search]);

  useEffect(() => { void load(); }, [load]);

  const countries = useMemo(
    () => Array.from(new Set((result?.data ?? []).map((location) => location.country).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b)),
    [result],
  );
  const companies = useMemo(() => {
    const unique = new Map<string, string>();
    (result?.data ?? []).forEach((location) => {
      if (location.company) unique.set(location.company.id, location.company.name);
    });
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [result]);
  const appliedFilterCount = (applied.status !== 'ALL' ? 1 : 0)
    + (applied.country ? 1 : 0)
    + (applied.companyId ? 1 : 0)
    + (search ? 1 : 0);
  const hasRows = (result?.data.length ?? 0) > 0;

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function applyFilters() {
    setApplied({ ...draft });
    setPage(1);
  }

  function resetFilters() {
    setSearchInput('');
    setSearch('');
    setApplied({ ...DEFAULT_FILTERS });
    setDraft({ ...DEFAULT_FILTERS });
    setPage(1);
    setPerPage(DEFAULT_PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-light text-brand"><LocationIcon /></span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Locations</h1>
            <p className="mt-1 text-sm text-ink-soft">Manage the places where your teams work.</p>
          </div>
        </div>
        <Link className="btn btn--primary" href="/locations/new"><PlusIcon />Add Location</Link>
      </section>

      <section className="card overflow-hidden" aria-label="Location list">
        <div className="flex flex-wrap items-center gap-3 px-4 py-4">
          <form onSubmit={submitSearch} role="search" className="relative min-w-[220px] flex-1 sm:max-w-sm">
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
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="location-filters-panel"
            className="relative inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-ink-soft hover:bg-canvas"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon /> Filters
            {appliedFilterCount > 0 && <span aria-label={`${appliedFilterCount} applied filters`} className="grid min-w-5 h-5 place-items-center rounded-full bg-brand px-1 text-xs font-semibold text-white">{appliedFilterCount}</span>}
          </button>
          <span className="ml-auto text-xs text-ink-muted">{applied.status === 'ACTIVE' ? 'Active status applied' : applied.status === 'INACTIVE' ? 'Inactive status applied' : 'All statuses'}</span>
        </div>

        {filtersOpen && (
          <div id="location-filters-panel">
            <LocationFilters
              draft={draft}
              countries={countries}
              companies={companies}
              onDraftChange={setDraft}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>
        )}

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <Banner kind="error">{error}</Banner>
            <button type="button" className="btn btn--ghost" onClick={() => void load()}>Retry</button>
          </div>
        )}
        {loading && <div className="p-4"><Spinner label="Loading locations" /></div>}

        {!loading && !error && result && (
          <>
            <div className="flex min-h-12 items-center justify-between gap-3 px-4 text-xs text-ink-soft" aria-live="polite">
              <span><strong className="text-ink">{result.total} locations</strong> found</span>
              <span>Sorted by name A–Z</span>
            </div>
            {hasRows ? (
              <>
                <LocationsTable locations={result.data} />
                <div className="border-t border-line">
                  <Pagination
                    total={result.total}
                    page={result.page}
                    perPage={result.perPage}
                    onPageChange={setPage}
                    onPerPageChange={(size) => { setPerPage(size); setPage(1); }}
                  />
                </div>
              </>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No locations found."
                  message="No locations found."
                  action={appliedFilterCount > 0 ? <button type="button" className="btn btn--ghost" onClick={resetFilters}>Reset Filters</button> : undefined}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
