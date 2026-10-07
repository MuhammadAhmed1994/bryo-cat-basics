'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Spinner, StatusDot } from '@/components/ui';
import { listLocations } from '@/features/locations/location-api';
import type { Location } from '@/features/locations/location-types';

interface CompanyLocationsProps {
  companyId: string;
  onLocationsLoaded: (count: number) => void;
}

/** Read-only associated locations with independent loading and retry behavior. */
export function CompanyLocations({ companyId, onLocationsLoaded }: CompanyLocationsProps) {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const firstPage = await listLocations({
        companyId,
        status: 'ALL',
        page: 1,
        perPage: 100,
        sortDir: 'ASC',
      });
      const results = [...firstPage.data];
      const pageCount = Math.ceil(firstPage.total / firstPage.perPage);

      for (let page = 2; page <= pageCount; page += 1) {
        const nextPage = await listLocations({
          companyId,
          status: 'ALL',
          page,
          perPage: 100,
          sortDir: 'ASC',
        });
        results.push(...nextPage.data);
      }

      results.sort((left, right) => left.name.localeCompare(right.name));
      setLocations(results);
      onLocationsLoaded(results.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [companyId, onLocationsLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="card px-7 py-6" aria-labelledby="company-locations-title">
      <h2 id="company-locations-title" className="text-base font-semibold text-ink">
        Locations
      </h2>

      {loading && <Spinner label="Loading company locations" />}

      {!loading && error && (
        <div className="mt-4 flex flex-wrap items-center gap-3" role="alert">
          <p className="m-0 text-sm text-red-700">Company locations could not be loaded.</p>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && locations?.length === 0 && (
        <p className="mt-3 text-sm text-ink-soft">No locations are associated with this company.</p>
      )}

      {!loading && !error && locations && locations.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {locations.map((location) => (
            <li key={location.id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/locations/${location.id}`}
                aria-label={`View location: ${location.name}`}
                className="inline-flex items-center gap-2 text-sm text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <StatusDot active={location.isActive} />
                <span>{location.name}</span>
                <span className="text-ink-soft">({location.isActive ? 'Active' : 'Inactive'})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
