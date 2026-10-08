'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner, StatusDot } from '@/components/ui';
import { FilterIcon, LocationIcon, PlusIcon, SearchIcon, SortIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

type LocationStatus = 'ACTIVE' | 'INACTIVE';

interface LocationRecord {
  id: string;
  name: string;
  country: string | null;
  status: LocationStatus;
  company: Pick<Company, 'id' | 'name'> | null;
}

interface LocationView {
  search: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ALL';
  country: string;
  companyId: string;
  page: number;
  perPage: number;
}

const DEFAULT_VIEW: LocationView = {
  search: '',
  status: 'ACTIVE',
  country: '',
  companyId: '',
  page: 1,
  perPage: 50,
};

/** Location list with server-side search, composable filters, and pagination. */
export function LocationsList() {
  const [view, setView] = useState<LocationView>(DEFAULT_VIEW);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<LocationRecord> | null>(null);
  const [companies, setCompanies] = useState<Array<Pick<Company, 'id' | 'name'>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleHasRecords, setModuleHasRecords] = useState(false);
  const requestNumber = useRef(0);

  useEffect(() => {
    let mounted = true;
    void apiFetch<Paginated<Company>>('/companies?status=ALL&perPage=100')
      .then((response) => {
        if (mounted) setCompanies(response.data.map(({ id, name }) => ({ id, name })));
      })
      .catch(() => {
        // The list remains usable even when optional Company filter choices cannot load.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++requestNumber.current;
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        search: view.search || undefined,
        status: view.status,
        country: view.country || undefined,
        companyId: view.companyId || undefined,
        page: view.page,
        perPage: view.perPage,
      });
      const page = await apiFetch<Paginated<LocationRecord>>(`/locations${query}`);
      if (requestId !== requestNumber.current) return;
      setResult(page);
      if (page.total === 0) {
        try {
          const allLocations = await apiFetch<Paginated<LocationRecord>>(
            '/locations?status=ALL&page=1&perPage=1',
          );
          if (requestId === requestNumber.current) {
            setModuleHasRecords(allLocations.total > 0);
          }
        } catch {
          if (requestId === requestNumber.current) setModuleHasRecords(false);
        }
      } else {
        setModuleHasRecords(true);
      }
    } catch (err) {
      if (requestId !== requestNumber.current) return;
      setError(err instanceof ApiError ? err.message : 'Locations could not be loaded. Try again.');
    } finally {
      if (requestId === requestNumber.current) setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setView((current) => ({ ...current, search: searchInput.trim(), page: 1 }));
  }

  function resetFilters() {
    setSearchInput('');
    setView({ ...DEFAULT_VIEW });
  }

  const records = result?.data ?? [];
  const activeFilterCount =
    (view.status !== 'ACTIVE' ? 1 : 0) +
    (view.country ? 1 : 0) +
    (view.companyId ? 1 : 0) +
    (view.search ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-light bg-brand-light text-brand">
            <LocationIcon />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Locations</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Manage the locations associated with your organization.
            </p>
          </div>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add Location
        </Link>
      </section>

      <section className="card overflow-hidden" aria-labelledby="location-filters-heading">
        <div className="flex items-center gap-2 px-6 py-4">
          <FilterIcon />
          <h2 id="location-filters-heading" className="text-sm font-semibold text-ink">
            Search and filters
          </h2>
          {activeFilterCount > 0 && (
            <span className="ml-auto text-xs text-ink-soft" aria-live="polite">
              {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-line px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
          <form onSubmit={applySearch} role="search">
            <label htmlFor="location-search" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Search locations
            </label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
              <span className="text-ink-muted"><SearchIcon /></span>
              <input
                id="location-search"
                type="search"
                value={searchInput}
                placeholder="Search by location name"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className="sr-only">Search locations</button>
            </div>
          </form>

          <div>
            <label htmlFor="location-status" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Status
            </label>
            <select
              id="location-status"
              aria-label="Filter by status"
              value={view.status}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              onChange={(event) =>
                setView((current) => ({ ...current, status: event.target.value as LocationView['status'], page: 1 }))
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All statuses</option>
            </select>
          </div>

          <div>
            <label htmlFor="location-country" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Country
            </label>
            <input
              id="location-country"
              type="text"
              value={view.country}
              placeholder="Enter stored country"
              aria-label="Filter by country"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              onChange={(event) => setView((current) => ({ ...current, country: event.target.value, page: 1 }))}
            />
            <p className="mt-1 text-xs text-ink-soft">Matches the country value saved on a Location.</p>
          </div>

          <div>
            <label htmlFor="location-company" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Company
            </label>
            <select
              id="location-company"
              aria-label="Filter by company"
              value={view.companyId}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              onChange={(event) => setView((current) => ({ ...current, companyId: event.target.value, page: 1 }))}
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas/40 px-6 py-3 text-xs text-ink-soft">
          <span>Showing active locations by name, A–Z.</span>
          <button type="button" className="font-semibold text-brand hover:underline" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </section>

      {error && (
        <Banner kind="error">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>Locations could not be loaded. Try again. {error !== 'Something went wrong.' ? error : ''}</span>
            <button type="button" className="font-semibold underline" onClick={() => void load()}>
              Retry
            </button>
          </span>
        </Banner>
      )}

      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && records.length > 0 && result && (
        <section className="card overflow-hidden" aria-labelledby="locations-results-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 id="locations-results-heading" className="text-sm font-semibold text-ink">
              Locations <span className="ml-2 text-xs font-normal text-ink-soft">{result.total} records</span>
            </h2>
            <span className="text-xs text-ink-soft">Rows per page: {view.perPage}</span>
          </div>
          <div className="table-wrap">
            <table className="table min-w-[600px]">
              <thead>
                <tr>
                  <th scope="col" aria-sort="ascending">
                    <span className="table__sort">Name <span className="text-brand" aria-label="Sorted ascending"><SortIcon /></span></span>
                  </th>
                  <th scope="col">Company</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((location) => (
                  <tr key={location.id} className="border-t border-line hover:bg-canvas/50">
                    <td>
                      <Link href={`/locations/${location.id}/edit`} className="truncate-cell font-semibold text-ink hover:text-brand hover:underline">
                        {location.name}
                      </Link>
                    </td>
                    <td><span className="truncate-cell">{location.company?.name ?? <span className="text-ink-muted">—</span>}</span></td>
                    <td>
                      <span className="inline-flex items-center gap-2 rounded-full border border-brand-light bg-brand-light/60 px-2.5 py-1 text-xs font-semibold text-brand">
                        <StatusDot active={location.status === 'ACTIVE'} />
                        {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
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
              onPerPageChange={(perPage) => setView((current) => ({ ...current, perPage, page: 1 }))}
            />
          </div>
        </section>
      )}

      {!loading && !error && records.length === 0 && !moduleHasRecords && (
        <EmptyState title="No locations found" message="Add a Location to see records here." />
      )}
      {!loading && !error && records.length === 0 && moduleHasRecords && (
        <EmptyState
          title="No locations match your criteria"
          message="No locations match your search or selected filters. Refine your search or reset filters to view available records."
          action={<button type="button" className="btn btn--ghost" onClick={resetFilters}>Reset filters</button>}
        />
      )}
    </div>
  );
}
