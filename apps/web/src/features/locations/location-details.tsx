'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Location, getLocation } from '@/features/locations/locations-api';
import { Banner, StatusDot } from '@/components/ui';

function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value : '-';
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{displayValue(value)}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="min-w-0">
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

/** Read-only details for a saved Location, including retry and missing-record states. */
export function LocationDetails({ id }: { id: string }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLocation(null);
    setNotFound(false);
    setError(false);
    try {
      setLocation(await getLocation(id));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
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
      <div className="card flex items-center justify-center px-6 py-16 text-sm text-ink-soft" role="status" aria-live="polite">
        Loading Location…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="m-0 text-sm text-ink-soft">Location not found.</p>
        <Link href="/locations" className="link">Locations</Link>
      </div>
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

  const active = location.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link href="/locations" className="link">Back to Locations</Link>
        <span aria-hidden="true">/</span>
        <span>Location Details</span>
      </nav>

      <h1 className="text-2xl font-semibold text-ink">Location Details</h1>

      <article className="card overflow-hidden" aria-labelledby="location-name">
        <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5 sm:px-7">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-light text-brand" aria-hidden="true">
            <span className="text-xl">⌖</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="location-name" className="m-0 text-lg font-semibold text-ink">{location.name}</h2>
            <span className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft">
              <StatusDot active={active} />
              {active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Link href={`/locations/${encodeURIComponent(location.id)}/edit`} className="btn btn--primary w-full sm:w-auto">
            Edit Location
          </Link>
        </header>

        <section className="px-6 py-6 sm:px-7" aria-labelledby="location-information">
          <h2 id="location-information" className="mb-6 text-base font-semibold text-ink">Location information</h2>
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
            <DetailSection title="Company & contact">
              <Detail label="Company" value={location.company?.name} />
              <Detail label="Contact name" value={location.contactPersonName} />
              <Detail label="Email" value={location.contactPersonEmail} />
              <Detail label="Phone" value={location.phone} />
              <Detail label="Contact phone" value={location.contactPersonPhone} />
            </DetailSection>

            <DetailSection title="Address">
              <Detail label="Address line 1" value={location.addressLine1} />
              <Detail label="Address line 2" value={location.addressLine2} />
              <Detail label="Country" value={location.country} />
              <Detail label="State / Province" value={location.stateProvince} />
              <Detail label="City" value={location.city} />
              <Detail label="Postal code" value={location.postalCode} />
            </DetailSection>
          </div>
        </section>
      </article>
    </div>
  );
}
