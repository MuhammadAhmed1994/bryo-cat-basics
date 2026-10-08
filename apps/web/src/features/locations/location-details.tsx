'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { getLocation, type Location } from '@/features/locations/locations-api';
import { Banner, Spinner, StatusDot } from '@/components/ui';

export default function LocationDetails({ locationId }: { locationId: string }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setNotFound(false);
    try {
      setLocation(await getLocation(locationId));
    } catch (cause) {
      setLocation(null);
      if (cause instanceof ApiError && cause.status === 404) {
        setNotFound(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading Location" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="m-0 text-sm text-ink-soft">Location not found.</p>
        <Link className="link" href="/locations">Locations</Link>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Banner kind="error">Location could not be loaded. Try again.</Banner>
        <button type="button" className="btn btn--ghost" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const active = location.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link className="link" href="/locations">Back to Locations</Link>
        <span aria-hidden="true">/</span>
        <span>Location Details</span>
      </nav>

      <h1 className="m-0 text-2xl font-semibold text-ink">Location Details</h1>

      <article className="card overflow-hidden" aria-labelledby="location-name">
        <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-light text-brand" aria-hidden="true">
            <LocationMarker />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="location-name" className="m-0 text-xl font-semibold text-ink">
              {location.name}
            </h2>
            <span className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft">
              <StatusDot active={active} />
              {active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(location.id)}/edit`}>
            Edit Location
          </Link>
        </header>

        <section className="px-6 py-6" aria-labelledby="location-information">
          <h3 id="location-information" className="mb-5 mt-0 text-base font-semibold text-ink">
            Location information
          </h3>
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[0.86fr_1.14fr]">
            <DetailGroup title="Company & contact">
              <Detail label="Company" value={location.company?.name} />
              <Detail label="Contact name" value={location.contactPersonName} />
              <Detail label="Email" value={location.contactPersonEmail} />
              <Detail label="Location phone" value={location.phone} />
              <Detail label="Contact phone" value={location.contactPersonPhone} />
            </DetailGroup>
            <DetailGroup title="Address">
              <Detail label="Address line 1" value={location.addressLine1} />
              <Detail label="Address line 2" value={location.addressLine2} />
              <Detail label="Country" value={location.country} />
              <Detail label="State / Province" value={location.stateProvince} />
              <Detail label="City" value={location.city} />
              <Detail label="Postal code" value={location.postalCode} />
            </DetailGroup>
          </div>
        </section>
      </article>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0" aria-label={title}>
      <h4 className="mb-4 mt-0 text-sm font-semibold text-ink">{title}</h4>
      <dl className="m-0 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  const displayValue = value?.trim() || '-';
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{displayValue}</dd>
    </div>
  );
}

function LocationMarker() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
