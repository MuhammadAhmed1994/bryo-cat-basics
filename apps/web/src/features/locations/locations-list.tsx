'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Pagination } from '@/components/pagination';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { LocationIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Location, listActiveCompanies, listLocations } from './locations-api';
import { CompanyOption, LocationFilters, LocationFilterValues } from './location-filters';
import { LocationTable } from './location-table';

interface ListView extends LocationFilterValues {
  search: string;
  page: number;
  perPage: number;
}

const DEFAULT_VIEW: ListView = {
  search: '',
  status: 'ACTIVE',
  country: '',
  companyId: '',
  page: 1,
  perPage: 50,
};

export function LocationsList() {
  const [view, setView] = useState<ListView>(DEFAULT_VIEW);
  const [locations, setLocations] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleIsEmpty, setModuleIsEmpty] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    listActiveCompanies()
      .then((result) => {
        if (current) setCompanies(result.data.map(({ id, name }) => ({ id, name })));
      })
      .catch(() => {
        // The list itself remains usable if the optional Company filter options fail.
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listLocations({
          search: view.search.trim(),
          status: view.status,
          country: view.country,
          companyId: view.companyId || undefined,
          sortDir: 'ASC',
          page: view.page,
          perPage: view.perPage,
        });
        if (!current) return;
        setLocations(result.data);
        setTotal(result.total);

        const hasNarrowing = Boolean(view.search.trim() || view.country.trim() || view.companyId) || view.status !== 'ACTIVE';
        if (result.total === 0 && !hasNarrowing) {
          const allLocations = await listLocations({ status: 'ALL', sortDir: 'ASC', page: 1, perPage: 1 });
          if (current) setModuleIsEmpty(allLocations.total === 0);
        } else {
          setModuleIsEmpty(false);
        }
      } catch (loadError) {
        if (current) setError(loadError instanceof ApiError ? loadError.message : 'Locations could not be loaded. Try again.');
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [view, retry]);

  const filterValues = useMemo<LocationFilterValues>(() => ({
    status: view.status,
    country: view.country,
    companyId: view.companyId,
  }), [view.status, view.country, view.companyId]);

  function updateFilters(next: LocationFilterValues) {
    setView((current) => ({ ...current, ...next, page: 1 }));
  }

  function reset() {
    setView({ ...DEFAULT_VIEW });
  }

  const hasLocations = locations.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-lg border border-brand-light bg-brand-light text-brand" aria-hidden="true"><LocationIcon /></span>
          <div>
            <h1 className="text-[28px] font-semibold leading-9 text-ink">Locations</h1>
            <p className="mt-1 text-sm text-ink-soft">Manage the places your teams operate.</p>
          </div>
        </div>
        <Link href="/locations/new" className="btn btn--primary"><PlusIcon /> Add Location</Link>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-white shadow-menu" aria-label="Location list">
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-56 flex-1 sm:max-w-sm" htmlFor="location-search">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"><SearchIcon /></span>
              <input
                id="location-search"
                type="search"
                aria-label="Search locations by name"
                placeholder="Search by name"
                value={view.search}
                className="h-10 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setView((current) => ({ ...current, search: event.target.value, page: 1 }))}
              />
            </label>
            <LocationFilters value={filterValues} companies={companies} onChange={updateFilters} />
            <button type="button" className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" onClick={reset}>Reset</button>
          </div>
        </div>

        {error && (
          <div className="p-5">
            <Banner kind="error">Locations could not be loaded. Try again. <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></Banner>
          </div>
        )}

        {loading && <div className="p-5"><Spinner label="Loading Locations" /></div>}

        {!loading && !error && (
          <>
            {hasLocations ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <p className="m-0 text-sm"><strong className="font-semibold text-ink">Locations</strong><span className="ml-2 text-xs text-ink-muted">{total} results</span></p>
                  <p className="m-0 text-xs text-ink-muted">Name A–Z</p>
                </div>
                <LocationTable locations={locations} />
                <div className="border-t border-line">
                  <Pagination
                    total={total}
                    page={view.page}
                    perPage={view.perPage}
                    onPageChange={(page) => setView((current) => ({ ...current, page }))}
                    onPerPageChange={(perPage) => setView((current) => ({ ...current, perPage, page: 1 }))}
                  />
                </div>
              </>
            ) : moduleIsEmpty ? (
              <div className="p-5"><EmptyState title="No Locations yet." message="Add a location to see it here." action={<Link className="btn btn--primary" href="/locations/new"><PlusIcon /> Add Location</Link>} /></div>
            ) : (
              <div className="p-5"><EmptyState title="No matching Locations" message="No Locations match your search." action={<button type="button" className="btn btn--ghost" onClick={reset}>Reset</button>} /></div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
