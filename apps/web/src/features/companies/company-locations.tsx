'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Spinner, StatusDot } from '@/components/ui';
import { listLocations } from '@/features/locations/location-api';
import type { Location } from '@/features/locations/location-types';

interface CompanyLocationsProps {
  companyId: string;
  onLocationsChange?: (locations: Location[]) => void;
}

/** Read-only, independently loaded associated locations on Company Details. */
export function CompanyLocations({ companyId, onLocationsChange }: CompanyLocationsProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await listLocations({ companyId, status: 'ALL', perPage: 100, sortDir: 'ASC' });
      const sorted = [...result.data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
      setLocations(sorted);
      onLocationsChange?.(sorted);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [companyId, onLocationsChange]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="card px-7 py-6" aria-labelledby="company-locations-heading">
      <h2 id="company-locations-heading" className="text-base font-semibold text-ink">
        Locations
      </h2>

      {loading && <Spinner label="Loading company locations" />}

      {!loading && error && (
        <div className="mt-4 flex flex-wrap items-center gap-3" role="alert">
          <p className="m-0 text-sm text-ink-soft">Company locations could not be loaded.</p>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && locations.length === 0 && (
        <p className="mt-3 text-sm text-ink-soft">No locations are associated with this company.</p>
      )}

      {!loading && !error && locations.length > 0 && (
        <>
          <p className="mt-3 text-sm text-ink-soft">Associated locations</p>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {locations.map((location) => (
              <li key={location.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link
                  className="link min-w-0 truncate"
                  href={`/locations/${encodeURIComponent(location.id)}`}
                >
                  {location.name}
                </Link>
                <span className="inline-flex shrink-0 items-center gap-2 text-sm text-ink-soft">
                  <StatusDot active={location.isActive} />
                  {location.isActive ? 'Active' : 'Inactive'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
