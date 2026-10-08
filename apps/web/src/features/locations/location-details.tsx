'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { getLocation, Location } from './locations-api';
import { Banner, EmptyState, Spinner } from '@/components/ui';

interface LocationDetailsProps {
  id: string;
}

/** Read-only view of a saved Location, including its optional company and address. */
export function LocationDetails({ id }: LocationDetailsProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError(false);
    try {
      setLocation(await getLocation(id));
    } catch (loadError) {
      setLocation(null);
      if (loadError instanceof ApiError && loadError.status === 404) {
        setNotFound(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section className="card" aria-live="polite">
        <Spinner label="Loading Location" />
      </section>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or is no longer available."
        action={
          <Link className="btn btn--ghost" href="/locations">
            Locations
          </Link>
        }
      />
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">Location could not be loaded. Try again.</Banner>
        <button type="button" className="btn btn--ghost self-start" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link className="link" href="/locations">Back to Locations</Link>
        <span aria-hidden="true">/</span>
        <span>Location Details</span>
      </nav>

      <h1 className="text-2xl font-semibold text-brand">Location Details</h1>

      <article className="card overflow-hidden" aria-labelledby="location-name">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-7 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-light text-brand" aria-hidden="true">
              <LocationMark />
            </span>
            <div className="min-w-0">
              <h2 id="location-name" className="m-0 text-xl font-semibold text-ink">
                {location.name}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    location.status === 'ACTIVE' ? 'bg-brand' : 'bg-ink-muted'
                  }`}
                  aria-hidden="true"
                />
                {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(location.id)}/edit`}>
            Edit Location
          </Link>
        </header>

        <section className="px-7 py-6" aria-labelledby="location-information-heading">
          <h3 id="location-information-heading" className="text-base font-semibold text-ink">
            Location information
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-7 lg:grid-cols-2">
            <section aria-labelledby="company-contact-heading">
              <h4 id="company-contact-heading" className="mb-4 text-sm font-semibold text-ink-soft">
                Company &amp; contact
              </h4>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Detail label="Company" value={location.company?.name} />
                <Detail label="Contact name" value={location.contactPersonName} />
                <Detail label="Email" value={location.contactPersonEmail} />
                <Detail label="Phone" value={location.phone} />
                <Detail label="Contact phone" value={location.contactPersonPhone} />
              </dl>
            </section>

            <section aria-labelledby="address-heading">
              <h4 id="address-heading" className="mb-4 text-sm font-semibold text-ink-soft">
                Address
              </h4>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Detail label="Address line 1" value={location.addressLine1} />
                <Detail label="Address line 2" value={location.addressLine2} />
                <Detail label="Country" value={location.country} />
                <Detail label="State/Province" value={location.stateProvince} />
                <Detail label="City" value={location.city} />
                <Detail label="Postal code" value={location.postalCode} />
              </dl>
            </section>
          </div>
        </section>
      </article>

      <Link href="/locations" className="link self-start">Back to Locations</Link>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  const displayValue = value?.trim() ? value : '-';
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className={`m-0 mt-1 break-words text-sm ${displayValue === '-' ? 'text-ink-muted' : 'text-ink'}`}>
        {displayValue}
      </dd>
    </div>
  );
}

function LocationMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
