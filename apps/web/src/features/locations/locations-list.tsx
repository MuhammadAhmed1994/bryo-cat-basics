'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, buildQuery } from '@/lib/api';
import { Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner, StatusDot, Truncated } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { FilterIcon, LocationIcon, PlusIcon, SearchIcon, SortIcon } from '@/components/icons';

type LocationStatus = 'ACTIVE' | 'INACTIVE';
type StatusFilter = LocationStatus | 'ALL';

interface LocationRecord {
  id: string;
  name: string;
  country: string | null;
  status: LocationStatus;
  companyId: string | null;
  company?: { id: string; name: string } | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface ListView {
  search: string;
  status: StatusFilter;
  country: string;
  companyId: string;
  page: number;
  perPage: number;
}

const INITIAL_VIEW: ListView = {
  search: '',
  status: 'ACTIVE',
  country: '',
  companyId: '',
  page: 1,
  perPage: 50,
};

export function LocationsList() {
  const [view, setView] = useState<ListView>(INITIAL_VIEW);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<LocationRecord> | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [noRecords, setNoRecords] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = searchInput.trim();
      setView((current) =>
        current.search === search ? current : { ...current, search, page: 1 },
      );
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query = buildQuery({
        status: view.status,
        search: view.search || undefined,
        country: view.country || undefined,
        companyId: view.companyId || undefined,
        page: view.page,
        perPage: view.perPage,
      });
      const page = await apiFetch<Paginated<LocationRecord>>(`/locations${query}`);
      setResult(page);

      if (page.total === 0) {
        try {
          const allLocations = await apiFetch<Paginated<LocationRecord>>(
            '/locations?status=ALL&page=1&perPage=1',
          );
          setNoRecords(allLocations.total === 0);
        } catch {
          setNoRecords(false);
        }
      } else {
        setNoRecords(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const firstPage = await apiFetch<Paginated<CompanyOption>>(
          '/companies?status=ALL&page=1&perPage=100',
        );
        const companies = [...firstPage.data];
        const pageCount = Math.ceil(firstPage.total / firstPage.perPage);
        for (let page = 2; page <= pageCount; page += 1) {
          const nextPage = await apiFetch<Paginated<CompanyOption>>(
            `/companies?status=ALL&page=${page}&perPage=100`,
          );
          companies.push(...nextPage.data);
        }
        if (mounted) setAvailableCompanies(companies);
      } catch {
        // Location-provided company values remain available if the company list fails.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const companyOptions = useMemo(() => {
    const options = new Map<string, string>();
    if (availableCompanies) {
      availableCompanies.forEach((company) => options.set(company.id, company.name));
    } else {
      result?.data.forEach((location) => {
        if (location.companyId && location.company?.name) {
          options.set(location.companyId, location.company.name);
        }
      });
    }
    return [...options.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [availableCompanies, result]);

  const hasRows = (result?.data.length ?? 0) > 0;
  const activeFilterCount =
    Number(view.status !== 'ACTIVE') + Number(Boolean(view.country)) + Number(Boolean(view.companyId));

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-light bg-brand-light text-brand">
            <LocationIcon />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Locations</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Manage the locations associated with your organization.
            </p>
          </div>
        </div>
        <Link className="btn btn--primary rounded-lg" href="/locations/new">
          <PlusIcon />
          Add Location
        </Link>
      </section>

      <section className="card overflow-hidden" aria-labelledby="location-filters-heading">
        <div className="flex items-center gap-2 px-5 py-4">
          <FilterIcon />
          <h2 id="location-filters-heading" className="text-sm font-semibold text-ink">
            Search and filters
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="location-search" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Search locations
            </label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="text-ink-muted"><SearchIcon /></span>
              <input
                id="location-search"
                type="search"
                autoComplete="off"
                value={searchInput}
                placeholder="Search by location name"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none focus:ring-0"
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="location-status" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Status
            </label>
            <select
              id="location-status"
              aria-label="Filter by status"
              value={view.status}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(event) =>
                setView((current) => ({
                  ...current,
                  status: event.target.value as StatusFilter,
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
              placeholder="Enter stored country value"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(event) =>
                setView((current) => ({ ...current, country: event.target.value, page: 1 }))
              }
            />
            <p className="mt-1 text-xs text-ink-soft">Filters using the country value saved on each location.</p>
          </div>
          <div>
            <label htmlFor="location-company" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Company
            </label>
            <select
              id="location-company"
              aria-label="Filter by company"
              value={view.companyId}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(event) =>
                setView((current) => ({ ...current, companyId: event.target.value, page: 1 }))
              }
            >
              <option value="">All companies</option>
              {companyOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas/50 px-5 py-3 text-xs text-ink-soft">
          <span>
            {view.status === 'ACTIVE' && !view.search && !view.country && !view.companyId
              ? 'Showing active locations by name, A–Z.'
              : `${activeFilterCount + Number(Boolean(view.search))} filter${activeFilterCount + Number(Boolean(view.search)) === 1 ? '' : 's'} applied.`}
          </span>
          <span>Country filtering uses saved values; no geography lookup is required.</span>
        </div>
      </section>

      {error && (
        <Banner kind="error">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>Locations could not be loaded. Try again.</span>
            <button type="button" className="font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" onClick={() => void load()}>
              Retry
            </button>
          </span>
        </Banner>
      )}

      {loading && (
        <section className="card">
          <Spinner label="Loading locations" />
        </section>
      )}

      {!loading && !error && hasRows && result && (
        <section className="card overflow-hidden" aria-labelledby="locations-results-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <h2 id="locations-results-heading" className="text-sm font-semibold text-ink">
              Locations <span className="ml-2 font-normal text-ink-muted">{result.total} records</span>
            </h2>
            <span className="text-xs text-ink-soft">Rows per page: {view.perPage}</span>
          </div>
          <div className="table-wrap">
            <table className="table min-w-[620px]">
              <thead>
                <tr>
                  <th scope="col" aria-sort="ascending" className="w-[43%]">
                    <span className="inline-flex items-center gap-2">Name <SortIcon /><span className="sr-only">sorted ascending</span></span>
                  </th>
                  <th scope="col" className="w-[39%]">Company</th>
                  <th scope="col" className="w-[18%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((location) => (
                  <tr key={location.id} className="border-t border-line hover:bg-canvas/60">
                    <td>
                      <Link className="font-semibold text-ink hover:text-brand hover:underline" href={`/locations/${location.id}/edit`}>
                        <Truncated value={location.name} />
                      </Link>
                    </td>
                    <td>
                      {location.company?.name ? (
                        <Truncated value={location.company.name} />
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2 rounded-full border border-brand-light bg-brand-light/60 px-2.5 py-1 text-xs font-semibold text-brand-dark">
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
              page={view.page}
              perPage={view.perPage}
              onPageChange={(page) => setView((current) => ({ ...current, page }))}
              onPerPageChange={(perPage) => setView((current) => ({ ...current, perPage, page: 1 }))}
            />
          </div>
        </section>
      )}

      {!loading && !error && !hasRows && noRecords && (
        <EmptyState title="No locations found" message="Add a location to see it listed here." />
      )}
      {!loading && !error && !hasRows && !noRecords && (
        <EmptyState
          title="No locations match your criteria"
          message="No locations match your search or selected filters. Refine your search or clear a filter to view records."
        />
      )}
    </div>
  );
}
