'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import type { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner, StatusDot, Truncated } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { LocationIcon, PlusIcon, SearchIcon, SortIcon } from '@/components/icons';
import { getCountries, listLocations } from './location-api';
import type { Location, LocationListStatus, PaginatedLocations } from './location-types';

const VIEW_KEY = 'nbryo.locations.view';

type PageSize = 25 | 50 | 100;
interface LocationView {
  search: string;
  status: LocationListStatus;
  country: string;
  companyId: string;
  page: number;
  perPage: PageSize;
}

const DEFAULT_VIEW: LocationView = {
  search: '',
  status: 'ACTIVE',
  country: '',
  companyId: '',
  page: 1,
  perPage: 50,
};

function readView(): LocationView {
  try {
    const stored = window.sessionStorage.getItem(VIEW_KEY);
    if (!stored) return DEFAULT_VIEW;
    const saved = JSON.parse(stored) as Partial<LocationView>;
    return {
      ...DEFAULT_VIEW,
      ...saved,
      page: 1,
      perPage: 50,
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

function locationCompanyName(location: Location, companies: Company[]): string {
  if (!location.companyId) return '—';
  return companies.find((company) => company.id === location.companyId)?.name ?? '—';
}

export function LocationList() {
  const [view, setView] = useState<LocationView>(DEFAULT_VIEW);
  const [searchInput, setSearchInput] = useState('');
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<PaginatedLocations | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleIsEmpty, setModuleIsEmpty] = useState(false);

  useEffect(() => {
    const restored = readView();
    setView(restored);
    setSearchInput(restored.search);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.sessionStorage.setItem(VIEW_KEY, JSON.stringify(view));
  }, [ready, view]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [page, countryOptions, companyPage] = await Promise.all([
        listLocations({
          search: view.search || undefined,
          status: view.status,
          country: view.country || undefined,
          companyId: view.companyId || undefined,
          page: view.page,
          perPage: view.perPage,
          sortDir: 'ASC',
        }),
        getCountries(),
        apiFetch<Paginated<Company>>('/companies?status=ALL&perPage=100'),
      ]);
      setResult(page);
      setCountries(countryOptions);
      setCompanies(companyPage.data);
      if (page.total === 0) {
        const allLocations = await listLocations({ status: 'ALL', page: 1, perPage: 50 });
        setModuleIsEmpty(allLocations.total === 0);
      } else {
        setModuleIsEmpty(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Locations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  function changeCriteria(change: Partial<LocationView>) {
    setView((current) => ({ ...current, ...change, page: 1 }));
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    changeCriteria({ search: searchInput.trim() });
  }

  function clearFilters() {
    setSearchInput('');
    setView({ ...DEFAULT_VIEW });
  }

  const hasRows = (result?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places connected to your companies.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add location
        </Link>
      </section>

      <section className="card flex flex-col gap-4 px-7 py-5" aria-label="Search and filter locations">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <form onSubmit={applySearch} role="search">
            <label className="mb-1.5 block text-xs font-medium text-ink-soft" htmlFor="location-search">
              Search locations
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                <SearchIcon />
              </span>
              <input
                id="location-search"
                type="search"
                value={searchInput}
                placeholder="Search by name, city, or phone"
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className="sr-only">Search</button>
            </div>
          </form>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft" htmlFor="location-status">Status</label>
            <select
              id="location-status"
              aria-label="Status"
              value={view.status}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => changeCriteria({ status: event.target.value as LocationListStatus })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft" htmlFor="location-country">Country</label>
            <select
              id="location-country"
              aria-label="Country"
              value={view.country}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => changeCriteria({ country: event.target.value })}
            >
              <option value="">All countries</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft" htmlFor="location-company">Company</label>
            <select
              id="location-company"
              aria-label="Company"
              value={view.companyId}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => changeCriteria({ companyId: event.target.value })}
            >
              <option value="">All companies</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </div>
        </div>
        <p className="m-0 text-xs text-ink-soft">Active locations are shown by default. Results are sorted by name A–Z; 50 locations per page.</p>
      </section>

      {error && (
        <Banner kind="error">
          <span>Locations could not be loaded. {error}</span>{' '}
          <button type="button" className="ml-2 font-semibold underline" onClick={() => void load()}>Retry</button>
        </Banner>
      )}

      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && hasRows && result && (
        <section className="card overflow-hidden">
          <div className="table-wrap overflow-x-auto">
            <table className="table min-w-[900px]">
              <thead>
                <tr>
                  <th scope="col" className="w-[22%]">
                    <span className="inline-flex items-center gap-2">Location name <SortIcon /><span className="sr-only">sorted ascending</span></span>
                  </th>
                  <th scope="col">Company</th>
                  <th scope="col">City</th>
                  <th scope="col">State / province</th>
                  <th scope="col">Country</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((location) => (
                  <tr key={location.id} className="border-t border-line">
                    <td>
                      <Link className="inline-flex items-center gap-2 text-ink hover:text-brand" href={`/locations/${location.id}`}>
                        <LocationIcon />
                        <Truncated value={location.name} />
                      </Link>
                    </td>
                    <td><Truncated value={locationCompanyName(location, companies)} /></td>
                    <td><Truncated value={location.city ?? '—'} /></td>
                    <td><Truncated value={location.stateProvince ?? '—'} /></td>
                    <td><Truncated value={location.country} /></td>
                    <td><Truncated value={location.phone ?? '—'} /></td>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot active={location.isActive} />
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line">
            <Pagination
              total={result.total}
              page={result.page}
              perPage={result.perPage}
              onPageChange={(page) => setView((current) => ({ ...current, page }))}
              onPerPageChange={(perPage) => setView((current) => ({ ...current, perPage: perPage as PageSize, page: 1 }))}
            />
          </div>
        </section>
      )}

      {!loading && !error && !hasRows && moduleIsEmpty && (
        <EmptyState
          title="No locations"
          message="Add a location to see it here."
          action={<Link className="btn btn--primary" href="/locations/new"><PlusIcon />Add location</Link>}
        />
      )}

      {!loading && !error && !hasRows && !moduleIsEmpty && (
        <EmptyState
          title="No locations match these filters."
          message="Try changing your search or filters to find locations."
          action={<button type="button" className="btn btn--ghost" onClick={clearFilters}>Clear filters</button>}
        />
      )}
    </div>
  );
}
