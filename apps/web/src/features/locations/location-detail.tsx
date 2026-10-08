'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Banner, EmptyState, Spinner, StatusDot, Toast } from '@/components/ui';
import { Location, getLocation } from './location-api';

interface LocationWithCompany extends Location {
  company?: { name?: string } | null;
}

/** Read-only Location details; editing is the only available record action. */
export function LocationDetail({ id }: { id: string }) {
  const [location, setLocation] = useState<LocationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setLocation(await getLocation(id) as LocationWithCompany);
    } catch (cause) {
      setLocation(null);
      if (cause instanceof ApiError && cause.status === 404) {
        setNotFound(true);
      } else {
        setError(cause instanceof Error ? cause.message : 'Location details could not be loaded. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setShowSuccess(query.get('success') === 'Location updated successfully.');
  }, []);

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or is no longer available."
        action={<Link className="btn btn--primary" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'Location details could not be loaded. Try again.'}</Banner>
        <div className="flex gap-3">
          <button className="btn btn--primary" type="button" onClick={() => void load()}>Retry</button>
          <Link className="btn btn--ghost" href="/locations">Back to Locations</Link>
        </div>
      </div>
    );
  }

  const active = location.status === 'ACTIVE';
  const companyName = location.company?.name?.trim();

  return (
    <div className="flex flex-col gap-4">
      {showSuccess && <Toast message="Location updated successfully." />}

      <nav className="text-xs text-ink-soft" aria-label="Breadcrumb">
        <Link className="hover:text-brand" href="/locations">Locations</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Location Details</span>
      </nav>

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Location</p>
          <h1 className="text-2xl font-semibold text-ink">{location.name}</h1>
          <span className="mt-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={active} />
            {active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(id)}/edit`}>Edit Location</Link>
      </header>

      <Link className="link w-fit" href="/locations">← Back to Locations</Link>

      <article className="card overflow-hidden" aria-label="Location information">
        <section className="border-b border-line px-6 py-5" aria-labelledby="company-contact-heading">
          <h2 id="company-contact-heading" className="mb-4 text-lg font-semibold text-ink">Company &amp; contact</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Company" value={companyName} />
            <Detail label="Location phone" value={location.phone} />
            <Detail label="Contact Person" value={location.contactPerson} />
            <Detail label="Contact Person phone" value={location.contactPersonPhone} />
          </dl>
        </section>

        <section className="px-6 py-5" aria-labelledby="address-heading">
          <h2 id="address-heading" className="mb-4 text-lg font-semibold text-ink">Address</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Address line 1" value={location.addressLine1} />
            <Detail label="Address line 2" value={location.addressLine2} />
            <Detail label="City" value={location.city} />
            <Detail label="State/Province" value={location.stateProvince} />
            <Detail label="Country" value={location.country} />
            <Detail label="Postal code" value={location.postalCode} />
          </dl>
        </section>
      </article>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value?.trim() || '-'}</dd>
    </div>
  );
}
