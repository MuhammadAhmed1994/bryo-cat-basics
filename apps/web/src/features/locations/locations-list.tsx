'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { PlusIcon, SearchIcon } from '@/components/icons';
import { listLocations, LocationListQuery, LocationRecord } from './location-api';
import { CompanyOption, LocationFilters, LocationStatusFilter } from './location-filters';
import { LocationsTable } from './locations-table';

const DEFAULT_VIEW: Required<Pick<LocationListQuery, 'status' | 'sortDir' | 'page' | 'perPage'>> &
  Pick<LocationListQuery, 'search' | 'country' | 'companyId'> = {
  status: 'ACTIVE',
  search: '',
  country: '',
  companyId: '',
  sortDir: 'ASC',
  page: 1,
  perPage: 50,
};

type ListView = typeof DEFAULT_VIEW;

async function loadFilterChoices() {
  const allLocations: LocationRecord[] = [];
  let total = Number.POSITIVE_INFINITY;
  let page = 1;
  while (allLocations.length < total) {
    const result = await listLocations({ status: 'ALL', page, perPage: 100, sortDir: 'ASC' });
    allLocations.push(...result.data);
    total = result.total;
    if (result.data.length === 0) break;
    page += 1;
  }

  const allCompanies: Company[] = [];
  total = Number.POSITIVE_INFINITY;
  page = 1;
  while (allCompanies.length < total) {
    const result = await apiFetch<Paginated<Company>>(`/companies?status=ALL&page=${page}&perPage=100`);
    allCompanies.push(...result.data);
    total = result.total;
    if (result.data.length === 0) break;
    page += 1;
  }

  return {
    countries: Array.from(new Set(allLocations.map((location) => location.country?.trim()).filter((country): country is string => Boolean(country)))).sort((a, b) => a.localeCompare(b)),
    companies: allCompanies.map(({ id, name }) => ({ id, name })),
  };
}

export function LocationsList() {
  const [view, setView] = useState<ListView>({ ...DEFAULT_VIEW });
  const [draftStatus, setDraftStatus] = useState<LocationStatusFilter>('ACTIVE');
  const [draftCountry, setDraftCountry] = useState('');
  const [draftCompany, setDraftCompany] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<LocationRecord> | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadFilterChoices()
      .then((choices) => {
        if (active) {
          setCountries(choices.countries);
          setCompanies(choices.companies);
        }
      })
      // Choices are supplementary; keep the list available if they cannot load.
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: LocationListQuery = {
        status: view.status,
        search: view.search || undefined,
        country: view.country || undefined,
        companyId: view.companyId || undefined,
        sortDir: view.sortDir,
        page: view.page,
        perPage: view.perPage,
      };
      setResult(await listLocations(query));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Locations could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => { void load(); }, [load]);

  const appliedCount = useMemo(() => (
    1 + (view.country ? 1 : 0) + (view.companyId ? 1 : 0) + (view.search ? 1 : 0)
  ), [view]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = searchInput.trim();
    setSearchInput(search);
    setView((current) => ({ ...current, search, page: 1 }));
  }

  function applyFilters() {
    setView((current) => ({
      ...current,
      status: draftStatus,
      country: draftCountry,
      companyId: draftCompany,
      search: searchInput.trim(),
      page: 1,
    }));
    setSearchInput((current) => current.trim());
  }

  function resetFilters() {
    setView({ ...DEFAULT_VIEW });
    setDraftStatus('ACTIVE');
    setDraftCountry('');
    setDraftCompany('');
    setSearchInput('');
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

      <section className="card flex flex-wrap items-center gap-3 px-5 py-4" aria-label="Search locations">
        <form onSubmit={submitSearch} role="search" className="relative min-w-[220px] flex-1 sm:max-w-md">
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
        <LocationFilters
          open={filtersOpen}
          onToggle={() => setFiltersOpen((open) => !open)}
          appliedCount={appliedCount}
          status={draftStatus}
          country={draftCountry}
          companyId={draftCompany}
          countries={countries}
          companies={companies}
          onStatusChange={setDraftStatus}
          onCountryChange={setDraftCountry}
          onCompanyChange={setDraftCompany}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </section>

      {error && <Banner kind="error">Locations could not be loaded. Try again.</Banner>}

      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && result && result.data.length > 0 && (
        <section className="card overflow-hidden" aria-label="Location results">
          <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-ink-soft" aria-live="polite">
            <span><strong className="text-ink">{result.total} locations</strong> found</span>
            <span>Sorted by name A–Z</span>
          </div>
          <LocationsTable locations={result.data.map((location) => (
            location.company || !location.companyId
              ? location
              : { ...location, company: companies.find((company) => company.id === location.companyId) ?? null }
          ))} />
          <div className="border-t border-line">
            <Pagination
              total={result.total}
              page={result.page}
              perPage={result.perPage}
              onPageChange={(page) => setView((current) => ({ ...current, page }))}
              onPerPageChange={(perPage) => setView((current) => ({ ...current, perPage, page: 1 }))}
            />
          </div>
        </section>
      )}

      {!loading && !error && result?.data.length === 0 && (
        <EmptyState
          title="No locations found."
          message="No locations found."
          action={appliedCount > 1 ? <button type="button" className="btn btn--ghost" onClick={resetFilters}>Reset Filters</button> : undefined}
        />
      )}
    </div>
  );
}
