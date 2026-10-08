'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { PlusIcon, SearchIcon } from '@/components/icons';
import { Location, LocationListQuery, listLocations } from './location-api';
import { LocationFilters, LocationFilterValues } from './location-filters';
import { LocationsTable } from './locations-table';

const DEFAULT_FILTERS: LocationFilterValues = { status: 'ACTIVE', country: '', companyId: '' };
const DEFAULT_PAGE_SIZE = 50;

export function LocationsList() {
  const [applied, setApplied] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<LocationFilterValues>(DEFAULT_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [result, setResult] = useState<Paginated<Location> | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const query = useMemo<LocationListQuery>(() => ({
    page: pageNumber,
    perPage,
    status: applied.status,
    sortDir: 'ASC',
    ...(search ? { search } : {}),
    ...(applied.country ? { country: applied.country } : {}),
    ...(applied.companyId ? { companyId: applied.companyId } : {}),
  }), [pageNumber, perPage, applied, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await listLocations(query));
    } catch {
      setError('Locations could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  // Load filter choices from every Location page independently of the currently
  // displayed results, so empty/currently-filtered pages cannot hide options.
  useEffect(() => {
    let current = true;
    async function loadFilterOptions() {
      try {
        const allLocations: Location[] = [];
        let currentPage = 1;
        let total = 0;
        do {
          const page = await listLocations({ page: currentPage, perPage: 100, status: 'ALL', sortDir: 'ASC' });
          allLocations.push(...page.data);
          total = page.total;
          if (page.data.length === 0) break;
          currentPage += 1;
        } while (allLocations.length < total && currentPage < 10000);
        if (!current) return;
        setCountries(Array.from(new Set(allLocations.map((location) => location.country?.trim()).filter((country): country is string => Boolean(country)))).sort((a, b) => a.localeCompare(b)));

        const associated = new Map<string, string>();
        allLocations.forEach((location) => {
          if (location.companyId && location.company?.name) associated.set(location.companyId, location.company.name);
        });
        const companyRows: Company[] = [];
        let companyPage = 1;
        let companyTotal = 0;
        try {
          do {
            const page = await apiFetch<Paginated<Company>>(`/companies${buildQuery({ status: 'ALL', page: companyPage, perPage: 100 })}`);
            companyRows.push(...page.data);
            companyTotal = page.total;
            if (page.data.length === 0) break;
            companyPage += 1;
          } while (companyRows.length < companyTotal && companyPage < 10000);
        } catch {
          // Location rows may already include Company names; use those if available.
        }
        if (!current) return;
        companyRows.forEach((company) => {
          if (allLocations.some((location) => location.companyId === company.id)) associated.set(company.id, company.name);
        });
        setCompanyNames(Object.fromEntries(associated));
        setCompanies(Array.from(associated, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        // Keep the list usable if only ancillary filter-choice loading fails.
      }
    }
    void loadFilterOptions();
    return () => { current = false; };
  }, []);

  const appliedCount = 1 + (applied.country ? 1 : 0) + (applied.companyId ? 1 : 0) + (search ? 1 : 0);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchText.trim());
    setPageNumber(1);
  }

  function applyFilters() {
    setApplied({ ...draft });
    setPageNumber(1);
  }

  function resetFilters() {
    setDraft({ ...DEFAULT_FILTERS });
    setApplied({ ...DEFAULT_FILTERS });
    setSearchText('');
    setSearch('');
    setPageNumber(1);
    setPerPage(DEFAULT_PAGE_SIZE);
  }

  const locations = result?.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places where your teams work.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new"><PlusIcon />Add Location</Link>
      </section>

      <section className="card flex flex-wrap items-center gap-3 px-5 py-4">
        <form onSubmit={submitSearch} role="search" className="relative w-full sm:max-w-sm">
          <label htmlFor="location-search" className="sr-only">Search locations</label>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"><SearchIcon /></span>
          <input
            id="location-search"
            type="search"
            placeholder="Search by Location name"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
          />
          <button type="submit" className="sr-only">Search</button>
        </form>
        <span className="text-xs text-ink-muted">Search by Location name</span>
      </section>

      <LocationFilters
        values={draft}
        countries={countries}
        companies={companies}
        appliedCount={appliedCount}
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((open) => !open)}
        onChange={setDraft}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {error && (
        <Banner kind="error">
          <span>{error} <button type="button" className="underline focus:outline-none" onClick={() => void load()}>Try again</button></span>
        </Banner>
      )}
      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && locations.length > 0 && result && (
        <section className="card overflow-hidden" aria-label="Location list">
          <div className="flex min-h-12 items-center justify-between gap-3 px-5 text-sm text-ink-soft" aria-live="polite">
            <span><strong className="text-ink">{result.total} locations</strong> found</span>
            <span>Sorted by name A–Z</span>
          </div>
          <LocationsTable locations={locations} companyNames={companyNames} />
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
      {!loading && !error && locations.length === 0 && (
        <EmptyState
          title="No locations found."
          message="Try adjusting your search or filters."
          action={appliedCount > 1 ? <button type="button" className="btn btn--ghost" onClick={resetFilters}>Reset Filters</button> : undefined}
        />
      )}
    </div>
  );
}
