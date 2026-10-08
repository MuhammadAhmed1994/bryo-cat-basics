'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner, StatusDot, Truncated } from '@/components/ui';
import { FilterIcon, LocationIcon, PlusIcon, SearchIcon, SortIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

type LocationStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

interface LocationRecord {
  id: string;
  name: string;
  country: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  companyId: string | null;
  company: Pick<Company, 'id' | 'name'> | null;
}

interface LocationView {
  search: string;
  status: LocationStatusFilter;
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

export function LocationsList() {
  const [view, setView] = useState<LocationView>(DEFAULT_VIEW);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<LocationRecord> | null>(null);
  const [companies, setCompanies] = useState<Array<Pick<Company, 'id' | 'name'>>>([]);
  const [moduleIsEmpty, setModuleIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestCounter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Paginated<Company>>('/companies?status=ALL&perPage=100')
      .then((page) => {
        if (!cancelled) setCompanies(page.data.map(({ id, name }) => ({ id, name })));
      })
      .catch(() => {
        // The locations list remains usable if the optional Company options cannot load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLocations = useCallback(async () => {
    const requestId = ++requestCounter.current;
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
      if (requestId !== requestCounter.current) return;
      setResult(page);

      if (page.total === 0) {
        const hasFilters = Boolean(
          view.search || view.country || view.companyId || view.status !== 'ACTIVE',
        );
        if (hasFilters || view.status === 'ACTIVE') {
          const allLocations = await apiFetch<Paginated<LocationRecord>>(
            '/locations?status=ALL&perPage=1',
          );
          if (requestId !== requestCounter.current) return;
          setModuleIsEmpty(allLocations.total === 0);
        } else {
          setModuleIsEmpty(true);
        }
      } else {
        setModuleIsEmpty(false);
      }
    } catch (err) {
      if (requestId === requestCounter.current) {
        setError(err instanceof ApiError ? err.message : 'Locations could not be loaded.');
      }
    } finally {
      if (requestId === requestCounter.current) setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setView((current) => ({ ...current, search: searchInput.trim(), page: 1 }));
  }

  function resetFilters() {
    setSearchInput('');
    setView({ ...DEFAULT_VIEW });
  }

  const hasRecords = (result?.data.length ?? 0) > 0;
  const activeFilterCount =
    (view.status !== 'ACTIVE' ? 1 : 0) + Number(Boolean(view.country)) + Number(Boolean(view.companyId));

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
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
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="location-filters-heading" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FilterIcon /> Search and filters
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
          <form onSubmit={submitSearch} role="search" className="min-w-0">
            <label htmlFor="location-search" className="mb-1.5 block text-xs font-semibold text-ink-soft">
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
                placeholder="Search by location name"
                autoComplete="off"
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className="sr-only">
                Search locations
              </button>
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
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(event) =>
                setView((current) => ({
                  ...current,
                  status: event.target.value as LocationStatusFilter,
                  page: 1,
                }))
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
              aria-label="Filter by country"
              value={view.country}
              placeholder="Enter saved country value"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(event) =>
                setView((current) => ({ ...current, country: event.target.value, page: 1 }))
              }
            />
            <p className="mt-1 text-xs text-ink-soft">Matches the country value saved on a location.</p>
          </div>

          <div>
            <label htmlFor="location-company" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Company
            </label>
            <select
              id="location-company"
              aria-label="Filter by company"
              value={view.companyId}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(event) =>
                setView((current) => ({ ...current, companyId: event.target.value, page: 1 }))
              }
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas/50 px-6 py-3 text-xs text-ink-soft">
          <span>
            <SortIcon /> Showing active locations by name, A–Z.
          </span>
          <span>{activeFilterCount ? `${activeFilterCount} filter(s) applied` : 'Country uses saved values only.'}</span>
        </div>
      </section>

      {error && (
        <Banner kind="error">
          <span>Locations could not be loaded. Try again. </span>
          <button
            type="button"
            className="ml-2 font-semibold underline focus-visible:outline focus-visible:outline-2"
            onClick={() => void loadLocations()}
          >
            Retry
          </button>
        </Banner>
      )}

      <section className="card overflow-hidden" aria-labelledby="locations-results-heading">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <h2 id="locations-results-heading" className="text-sm font-semibold text-ink">
            Locations{result ? <span className="ml-2 text-xs font-normal text-ink-soft">{result.total} records</span> : null}
          </h2>
        </div>

        {loading && <Spinner label="Loading locations" />}

        {!loading && !error && hasRecords && result && (
          <>
            <div className="overflow-x-auto">
              <table className="table min-w-[600px]">
                <thead>
                  <tr>
                    <th scope="col" aria-sort="ascending" className="w-[43%]">
                      Name <span className="sr-only">sorted ascending</span>
                    </th>
                    <th scope="col" className="w-[39%]">Company</th>
                    <th scope="col" className="w-[18%]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((location) => (
                    <tr key={location.id} className="border-t border-line">
                      <td>
                        <Link className="font-semibold text-ink hover:text-brand" href={`/locations/${location.id}/edit`}>
                          <Truncated value={location.name} />
                        </Link>
                      </td>
                      <td>
                        {location.company?.name ?? <span className="text-ink-muted">—</span>}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2">
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
          </>
        )}
      </section>

      {!loading && !error && !hasRecords && moduleIsEmpty && (
        <EmptyState title="No locations found." message="Add a location to see it listed here." />
      )}
      {!loading && !error && !hasRecords && !moduleIsEmpty && (
        <EmptyState
          title="No locations match your criteria"
          message="No locations match your search or selected filters. Refine your search or clear filters to view available records."
          action={
            <button type="button" className="btn btn--ghost" onClick={resetFilters}>
              Reset filters
            </button>
          }
        />
      )}
    </div>
  );
}
