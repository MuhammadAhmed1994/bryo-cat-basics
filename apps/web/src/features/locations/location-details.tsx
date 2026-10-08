'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Banner, EmptyState, Spinner, StatusDot, Toast } from '@/components/ui';
import { getLocation, Location } from './locations-api';

export default function LocationDetails({
  id,
  updated = false,
}: {
  id: string;
  updated?: boolean;
}) {
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
  }, [id]);

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
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or the link may be incorrect."
        action={<Link className="link" href="/locations">Locations</Link>}
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
      {updated && <Toast message="Location updated successfully." />}

      <nav className="flex items-center gap-2 text-sm text-ink-soft" aria-label="Breadcrumb">
        <Link className="link--muted" href="/locations">Back to Locations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Location Details</span>
      </nav>

      <h1 className="text-2xl font-semibold text-ink">Location Details</h1>

      <article className="card overflow-hidden" aria-labelledby="location-name">
        <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5 sm:px-7">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-light text-brand" aria-hidden="true">
            <LocationPinIcon />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="location-name" className="text-xl font-semibold text-ink">{location.name}</h2>
            <span className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft">
              <StatusDot active={location.status === 'ACTIVE'} />
              {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Link className="btn btn--primary w-full sm:w-auto" href={`/locations/${encodeURIComponent(location.id)}/edit`}>
            Edit Location
          </Link>
        </header>

        <section className="px-6 py-6 sm:px-7" aria-labelledby="location-info-heading">
          <h3 id="location-info-heading" className="mb-5 text-base font-semibold text-ink">Location information</h3>
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[0.86fr_1.14fr] lg:gap-0">
            <section className="min-w-0 lg:pr-7" aria-labelledby="contact-heading">
              <h4 id="contact-heading" className="mb-4 font-semibold text-ink">Company &amp; contact</h4>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                <Detail label="Company" value={location.company?.name} />
                <Detail label="Contact name" value={location.contactPersonName} />
                <Detail label="Email" value={location.contactPersonEmail} />
                <Detail label="Contact phone" value={location.contactPersonPhone} />
                <Detail label="Location phone" value={location.phone} />
              </dl>
            </section>

            <section className="min-w-0 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0" aria-labelledby="address-heading">
              <h4 id="address-heading" className="mb-4 font-semibold text-ink">Address</h4>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                <Detail label="Address line 1" value={location.addressLine1} />
                <Detail label="Address line 2" value={location.addressLine2} />
                <Detail label="Country" value={location.country} />
                <Detail label="State / Province" value={location.stateProvince} />
                <Detail label="City" value={location.city} />
                <Detail label="Postal code" value={location.postalCode} />
              </dl>
            </section>
          </div>
        </section>
      </article>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  const present = Boolean(value?.trim());
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className={`m-0 mt-1 break-words text-sm ${present ? 'text-ink' : 'text-ink-muted'}`}>
        {present ? value : '-'}
      </dd>
    </div>
  );
}

function LocationPinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
