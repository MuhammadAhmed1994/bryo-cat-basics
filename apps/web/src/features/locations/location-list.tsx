'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch } from '@/lib/api';
import type { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner, StatusDot, Truncated } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { LocationIcon, PlusIcon, SearchIcon, SortIcon } from '@/components/icons';
import { listLocations } from './location-api';
import type { Location, LocationListStatus, PaginatedLocations } from './location-types';

const VIEW_KEY = 'nbryo.locations.view';
type View = {
  search: string;
  status: LocationListStatus;
  country: string;
  companyId: string;
  page: number;
};
const DEFAULT_VIEW: View = { search: '', status: 'ACTIVE', country: '', companyId: '', page: 1 };

function readView(): View {
  try {
    const stored = window.sessionStorage.getItem(VIEW_KEY);
    if (!stored) return DEFAULT_VIEW;
    const parsed = JSON.parse(stored) as Partial<View>;
    return {
      ...DEFAULT_VIEW,
      ...parsed,
      status: ['ACTIVE', 'INACTIVE', 'ALL'].includes(parsed.status ?? '')
        ? (parsed.status as LocationListStatus)
        : DEFAULT_VIEW.status,
      page: typeof parsed.page === 'number' && parsed.page > 0 ? parsed.page : 1,
    };
  } catch {
    return DEFAULT_VIEW;
  }
}

export function LocationList() {
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [result, setResult] = useState<PaginatedLocations | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [moduleIsEmpty, setModuleIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setView(readView());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.sessionStorage.setItem(VIEW_KEY, JSON.stringify(view));
  }, [ready, view]);

  const load = useCallback(async () => {
    if (!ready) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const [page, allLocations] = await Promise.all([
        listLocations({
          search: view.search || undefined,
          status: view.status,
          country: view.country || undefined,
          companyId: view.companyId || undefined,
          sortDir: 'ASC',
          page: view.page,
          perPage: 50,
        }),
        listLocations({ status: 'ALL', page: 1, perPage: 1 }),
      ]);
      if (currentRequest !== requestId.current) return;
      setResult(page);
      setModuleIsEmpty(allLocations.total === 0);
      if (page.page !== view.page && page.total > 0) {
        setView((current) => ({ ...current, page: page.page }));
      }
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(err instanceof ApiError ? err.message : 'Locations could not be loaded.');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [ready, view]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!ready) return;
    void Promise.all([
      apiFetch<string[]>('/locations/reference/countries'),
      apiFetch<Paginated<Company>>('/companies?status=ALL&perPage=100&page=1'),
    ])
      .then(([countryNames, companyPage]) => {
        setCountries(countryNames);
        setCompanies(companyPage.data);
      })
      .catch(() => {
        // Filter option failures do not block the list or its retry behavior.
      });
  }, [ready]);

  const updateCriteria = (changes: Partial<View>) => {
    setView((current) => ({ ...current, ...changes, page: 1 }));
  };

  const clearFilters = () => setView({ ...DEFAULT_VIEW });
  const hasRecords = (result?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage the places connected to your companies.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add location
        </Link>
      </header>

      <section className="card flex flex-wrap items-end gap-4 px-6 py-5" aria-label="Search and filter locations">
        <div className="min-w-[220px] flex-[1.5]">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft" htmlFor="location-search">
            Search locations
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"><SearchIcon /></span>
            <input
              id="location-search"
              type="search"
              value={view.search}
              placeholder="Search by name, city, or phone"
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
              onChange={(event) => updateCriteria({ search: event.target.value })}
            />
          </div>
        </div>
        <label className="min-w-[135px] flex-1 text-xs font-medium text-ink-soft">
          <span className="mb-1.5 block">Status</span>
          <select
            aria-label="Status"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            value={view.status}
            onChange={(event) => updateCriteria({ status: event.target.value as LocationListStatus })}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALL">All</option>
          </select>
        </label>
        <label className="min-w-[150px] flex-1 text-xs font-medium text-ink-soft">
          <span className="mb-1.5 block">Country</span>
          <select
            aria-label="Country"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            value={view.country}
            onChange={(event) => updateCriteria({ country: event.target.value })}
          >
            <option value="">All countries</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </label>
        <label className="min-w-[165px] flex-1 text-xs font-medium text-ink-soft">
          <span className="mb-1.5 block">Company</span>
          <select
            aria-label="Company"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            value={view.companyId}
            onChange={(event) => updateCriteria({ companyId: event.target.value })}
          >
            <option value="">All companies</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>
        <p className="m-0 w-full text-xs text-ink-soft">Active locations are shown by default. Results are sorted by name A–Z, 50 locations per page.</p>
      </section>

      {error && (
        <Banner kind="error">
          <span>Locations could not be loaded. {error} </span>
          <button className="ml-2 font-semibold underline" type="button" onClick={() => void load()}>Retry</button>
        </Banner>
      )}
      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && hasRecords && result && (
        <section className="card overflow-hidden" aria-label="Location results">
          <div className="border-b border-line px-6 py-4 text-sm font-medium text-ink">
            {result.total} locations <span className="font-normal text-ink-soft">matching your filters</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table min-w-[950px]">
              <thead><tr>
                <th scope="col"><span className="inline-flex items-center gap-2">Location name <span aria-label="Sorted ascending"><SortIcon /></span></span></th>
                <th scope="col">Company</th><th scope="col">City</th><th scope="col">State / province</th>
                <th scope="col">Country</th><th scope="col">Phone</th><th scope="col">Status</th>
              </tr></thead>
              <tbody>
                {result.data.map((location: Location) => (
                  <tr key={location.id}>
                    <td><Link className="inline-flex items-center gap-2 text-ink hover:text-brand" href={`/locations/${location.id}`}><LocationIcon /><Truncated value={location.name} /></Link></td>
                    <td>{companies.find((company) => company.id === location.companyId)?.name ?? <span className="text-ink-muted">—</span>}</td>
                    <td>{location.city || '—'}</td><td>{location.stateProvince || '—'}</td>
                    <td>{location.country}</td><td>{location.phone || '—'}</td>
                    <td><span className="inline-flex items-center gap-2"><StatusDot active={location.isActive} />{location.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line [&>div>label]:hidden">
            <Pagination
              total={result.total}
              page={view.page}
              perPage={50}
              onPageChange={(page) => setView((current) => ({ ...current, page }))}
              onPerPageChange={() => undefined}
            />
          </div>
        </section>
      )}

      {!loading && !error && !hasRecords && moduleIsEmpty && (
        <EmptyState
          title="No locations"
          message="Add a location to see it in your workspace."
          action={<Link className="btn btn--primary" href="/locations/new"><PlusIcon />Add location</Link>}
        />
      )}
      {!loading && !error && !hasRecords && !moduleIsEmpty && (
        <EmptyState
          title="No locations match these filters."
          message="Try changing your search or filters to find locations."
          action={<button type="button" className="btn btn--ghost" onClick={clearFilters}>Clear filters</button>}
        />
      )}
    </div>
  );
}
