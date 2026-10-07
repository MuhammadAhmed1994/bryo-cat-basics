'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner, StatusDot, Toast } from '@/components/ui';
import { getLocation, Location } from './location-api';
import { ApiError, apiFetch } from '@/lib/api';

type LocationWithCompany = Location & {
  company?: { id?: string; name: string } | null;
  companyName?: string | null;
};

export function LocationDetail({
  id,
  showUpdatedToast = false,
}: {
  id: string;
  showUpdatedToast?: boolean;
}) {
  const [location, setLocation] = useState<LocationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setNotFound(false);
    try {
      const record = (await getLocation(id)) as LocationWithCompany;
      if (record.companyId && !record.company?.name && !record.companyName) {
        try {
          const company = await apiFetch<{ name: string }>(`/companies/${encodeURIComponent(record.companyId)}`);
          record.companyName = company.name;
        } catch {
          // The saved Location details remain available if its Company name cannot be retrieved.
        }
      }
      setLocation(record);
    } catch (cause) {
      setLocation(null);
      if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="card"><Spinner label="Loading Location" /></div>;
  }

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or is no longer available."
        action={<Link className="link" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">
          Location details could not be loaded. Try again.{' '}
          <button className="font-semibold underline" type="button" onClick={() => void load()}>Retry</button>
        </Banner>
        <Link className="link" href="/locations">Back to Locations</Link>
      </div>
    );
  }

  const active = location.status === 'ACTIVE';
  const companyName = location.company?.name ?? location.companyName;

  return (
    <div className="flex flex-col gap-4">
      {showUpdatedToast && <Toast message="Location updated successfully." />}

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link className="hover:text-brand" href="/locations">Locations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Location Details</span>
      </nav>

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Location Details</h1>
          <p className="mt-1 text-sm text-ink-soft">Review the saved information for this location.</p>
        </div>
        <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(id)}/edit`}>
          Edit Location
        </Link>
      </header>

      <Link aria-label="Back to Locations" className="link flex w-fit items-center gap-1" href="/locations">← Back to Locations</Link>

      <article className="card overflow-hidden" aria-label="Location information">
        <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5">
          <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-lg bg-brand-light text-brand">
            <LocationMark />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">Location</p>
            <h2 className="m-0 truncate text-lg font-semibold text-ink">{location.name}</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-sm font-medium text-ink">
            <StatusDot active={active} />
            {active ? 'Active' : 'Inactive'}
          </span>
        </header>

        <section className="border-b border-line px-6 py-5" aria-labelledby="location-contact-heading">
          <h3 id="location-contact-heading" className="mb-4 text-base font-semibold text-ink">Company &amp; contact</h3>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Company" value={companyName} />
            <Detail label="Location phone" value={location.phone} />
            <Detail label="Contact Person" value={location.contactPerson} />
            <Detail label="Contact Person phone" value={location.contactPersonPhone} />
          </dl>
        </section>

        <section className="px-6 py-5" aria-labelledby="location-address-heading">
          <h3 id="location-address-heading" className="mb-4 text-base font-semibold text-ink">Address</h3>
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
      <dd className="m-0 mt-1 break-words text-sm text-ink">{value?.trim() || '-'}</dd>
    </div>
  );
}

function LocationMark() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
