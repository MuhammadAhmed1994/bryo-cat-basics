'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner, StatusDot } from '@/components/ui';
import { FilterIcon, LocationIcon, PlusIcon, SearchIcon, SortIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

interface LocationRecord {
  id: string;
  name: string;
  country?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  company?: { id: string; name: string } | null;
  companyId?: string | null;
}

interface LocationView {
  search: string;
  status: 'ACTIVE' | 'INACTIVE';
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleIsEmpty, setModuleIsEmpty] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setView((current) =>
        current.search === searchInput.trim()
          ? current
          : { ...current, search: searchInput.trim(), page: 1 },
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    apiFetch<Paginated<Company>>('/companies?status=ALL&page=1&perPage=100')
      .then((page) => {
        if (active) setCompanies(page.data);
      })
      .catch(() => {
        // Company choices are supplementary; a location-list failure is handled separately.
      });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
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
      setResult(page);

      if (page.total === 0) {
        // Probe both stored statuses without search/filter constraints to distinguish
        // an empty module from a search/filter result with no matches.
        const [activePage, inactivePage] = await Promise.all(
          (['ACTIVE', 'INACTIVE'] as const).map((status) =>
            apiFetch<Paginated<LocationRecord>>(
              `/locations${buildQuery({ status, page: 1, perPage: 1 })}`,
            ),
          ),
        );
        setModuleIsEmpty(activePage.total === 0 && inactivePage.total === 0);
      } else {
        setModuleIsEmpty(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Locations could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasLocations = (result?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-emerald-100 bg-brand-light p-2 text-brand">
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

      <section className="card overflow-hidden" aria-labelledby="locations-filters-heading">
        <div className="flex items-center gap-2 px-6 py-4 text-sm font-semibold text-ink">
          <FilterIcon />
          <h2 id="locations-filters-heading">Search and filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-line p-6 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="location-search" className="mb-1.5 block text-xs font-medium text-ink-soft">
              Search locations
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand">
              <span className="text-ink-muted"><SearchIcon /></span>
              <input
                id="location-search"
                type="search"
                value={searchInput}
                placeholder="Search by location name"
                autoComplete="off"
                className="min-w-0 flex-1 py-2.5 text-sm outline-none"
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="location-status" className="mb-1.5 block text-xs font-medium text-ink-soft">
              Status
            </label>
            <select
              id="location-status"
              aria-label="Filter by status"
              value={view.status}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              onChange={(event) =>
                setView((current) => ({
                  ...current,
                  status: event.target.value as LocationView['status'],
                  page: 1,
                }))
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="location-country" className="mb-1.5 block text-xs font-medium text-ink-soft">
              Country
            </label>
            <input
              id="location-country"
              type="search"
              value={view.country}
              placeholder="Enter stored country value"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              onChange={(event) =>
                setView((current) => ({ ...current, country: event.target.value, page: 1 }))
              }
            />
            <p className="mt-1 text-xs text-ink-soft">Filters by the country value saved on a location.</p>
          </div>
          <div>
            <label htmlFor="location-company" className="mb-1.5 block text-xs font-medium text-ink-soft">
              Company
            </label>
            <select
              id="location-company"
              aria-label="Filter by company"
              value={view.companyId}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              onChange={(event) =>
                setView((current) => ({ ...current, companyId: event.target.value, page: 1 }))
              }
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-6 py-3 text-xs text-ink-soft">
          <p className="flex items-center gap-2">
            <SortIcon />
            Showing {view.status === 'ACTIVE' ? 'active' : 'inactive'} locations by name, A–Z.
          </p>
          <p>Country filtering uses saved values; no geography lookup is used.</p>
        </div>
      </section>

      {error && (
        <Banner kind="error">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>Locations could not be loaded. {error}</span>
            <button type="button" className="font-semibold underline" onClick={() => void load()}>
              Try again
            </button>
          </span>
        </Banner>
      )}

      {loading && <section className="card"><Spinner label="Loading locations" /></section>}

      {!loading && !error && hasLocations && result && (
        <section className="card overflow-hidden" aria-labelledby="locations-results-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 id="locations-results-heading" className="text-sm font-semibold text-ink">
              Locations <span className="ml-2 font-normal text-ink-soft">{result.total} records</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table min-w-[620px]">
              <thead>
                <tr>
                  <th scope="col" aria-sort="ascending">
                    <span className="inline-flex items-center gap-2">Name <span className="text-brand" aria-hidden="true">↑</span><span className="sr-only">sorted ascending</span></span>
                  </th>
                  <th scope="col">Company</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((location) => (
                  <tr key={location.id} className="border-t border-line">
                    <td>
                      <Link className="font-semibold text-ink hover:text-brand" href={`/locations/${location.id}/edit`}>
                        <span className="truncate-cell" title={location.name}>{location.name}</span>
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
        </section>
      )}

      {!loading && !error && !hasLocations && moduleIsEmpty && (
        <EmptyState title="No locations" message="Add a location to see it here." />
      )}
      {!loading && !error && !hasLocations && !moduleIsEmpty && (
        <EmptyState
          title="No locations match your criteria"
          message="No locations match your search or selected filters. Refine your search or filters to view available records."
        />
      )}
    </div>
  );
}
