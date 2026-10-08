'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LocationIcon } from '@/components/icons';
import { Banner, EmptyState, Spinner, StatusDot, Toast } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { getLocation, LocationRecord } from './location-api';

const SUCCESS_MESSAGE = 'Location updated successfully.';

function display(value: string | null | undefined): string {
  return value?.trim() ? value : '-';
}

function FieldValue({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{display(value)}</dd>
    </div>
  );
}

export function LocationDetail({ id }: { id: string }) {
  const [location, setLocation] = useState<LocationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      setLocation(await getLocation(id));
    } catch (err) {
      setLocation(null);
      const is404 = err instanceof ApiError
        ? err.status === 404
        : Boolean(err && typeof err === 'object' && 'status' in err && err.status === 404);
      if (is404) setNotFound(true);
      else setError('Location details could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowUpdatedToast(new URLSearchParams(window.location.search).get('success') === SUCCESS_MESSAGE);
    }
  }, []);

  if (loading) {
    return <div className="card"><Spinner label="Loading Location" /></div>;
  }

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="The Location may have been removed or is no longer available."
        action={<Link className="link" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'Location details could not be loaded. Try again.'}</Banner>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn--primary" onClick={() => void load()}>Retry</button>
          <Link className="link" href="/locations">Back to Locations</Link>
        </div>
      </div>
    );
  }

  const active = location.status === 'ACTIVE';
  const editHref = `/locations/${encodeURIComponent(id)}/edit`;

  return (
    <div className="flex flex-col gap-4">
      {showUpdatedToast && <Toast message={SUCCESS_MESSAGE} />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">Location Details</h1>
          <p className="mt-1 text-sm text-ink-soft">Review the saved information for this location.</p>
        </div>
        <Link className="btn btn--primary" href={editHref}>Edit Location</Link>
      </header>

      <div>
        <Link className="link--muted inline-flex items-center gap-2" href="/locations">← Back to Locations</Link>
      </div>

      <article className="card overflow-hidden">
        <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-light text-brand" aria-hidden="true">
            <LocationIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">Location</p>
            <h2 className="truncate text-lg font-semibold text-ink" title={location.name}>{location.name}</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-sm font-semibold text-ink">
            <StatusDot active={active} />
            {active ? 'Active' : 'Inactive'}
          </span>
        </header>

        <section className="border-b border-line px-6 py-5" aria-labelledby="location-company-contact">
          <h3 id="location-company-contact" className="mb-4 text-base font-semibold text-ink">Company &amp; contact</h3>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldValue label="Company" value={location.company?.name} />
            <FieldValue label="Contact Person" value={location.contactPerson} />
            <FieldValue label="Location phone" value={location.phone} />
            <FieldValue label="Contact Person phone" value={location.contactPersonPhone} />
          </dl>
        </section>

        <section className="px-6 py-5" aria-labelledby="location-address">
          <h3 id="location-address" className="mb-4 text-base font-semibold text-ink">Address</h3>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldValue label="Address line 1" value={location.addressLine1} />
            <FieldValue label="Address line 2" value={location.addressLine2} />
            <FieldValue label="City" value={location.city} />
            <FieldValue label="State/Province" value={location.stateProvince} />
            <FieldValue label="Country" value={location.country} />
            <FieldValue label="Postal code" value={location.postalCode} />
          </dl>
        </section>
      </article>
    </div>
  );
}
