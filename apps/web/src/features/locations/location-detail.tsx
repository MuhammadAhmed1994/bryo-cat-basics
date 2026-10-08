'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Banner, EmptyState, Spinner, StatusDot, Toast } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { Location, getLocation } from './location-api';

function DetailValue({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{value?.trim() || '-'}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-5 sm:px-7" aria-label={title}>
      <h2 className="mb-4 text-base font-semibold text-ink">{title}</h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function LocationDetail({ id }: { id: string }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setLocation(await getLocation(id));
    } catch (loadError) {
      setLocation(null);
      if (loadError instanceof ApiError && loadError.status === 404) {
        setNotFound(true);
      } else {
        setError('Location details could not be loaded. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get('success');
    setSuccess(message === 'Location updated successfully.');
  }, []);

  if (loading) {
    return <div className="card"><Spinner label="Loading Location" /></div>;
  }

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="The Location may have been removed or the link may be incorrect."
        action={<Link className="btn btn--primary" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'Location details could not be loaded. Try again.'}</Banner>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn--primary" onClick={() => void load()}>Retry</button>
          <Link href="/locations" className="btn btn--ghost">Back to Locations</Link>
        </div>
      </div>
    );
  }

  const active = location.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-4">
      {success && <Toast message="Location updated successfully." />}

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-muted">
        <Link href="/locations" className="text-ink-soft hover:text-brand">Locations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Location Details</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Location Details</h1>
          <p className="mt-1 text-sm text-ink-soft">Review the saved information for this location.</p>
        </div>
        <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(id)}/edit`}>Edit Location</Link>
      </header>

      <Link href="/locations" aria-label="Back to Locations" className="w-fit text-sm text-ink-soft hover:text-brand">← Back to Locations</Link>

      <article className="card overflow-hidden" aria-label="Location information">
        <header className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-7">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-brand-light text-brand" aria-hidden="true">⌖</span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">Location</p>
            <h2 className="truncate text-lg font-semibold text-ink" title={location.name}>{location.name}</h2>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${active ? 'border-brand-light bg-brand-light text-brand' : 'border-line bg-canvas text-ink-soft'}`}>
            <StatusDot active={active} />
            {active ? 'Active' : 'Inactive'}
          </span>
        </header>

        <DetailSection title="Company & contact">
          <DetailValue label="Company" value={location.company?.name} />
          <DetailValue label="Location phone" value={location.phone} />
          <DetailValue label="Contact Person" value={location.contactPerson} />
          <DetailValue label="Contact Person phone" value={location.contactPersonPhone} />
        </DetailSection>

        <DetailSection title="Address">
          <DetailValue label="Address line 1" value={location.addressLine1} />
          <DetailValue label="Address line 2" value={location.addressLine2} />
          <DetailValue label="City" value={location.city} />
          <DetailValue label="State/Province" value={location.stateProvince} />
          <DetailValue label="Country" value={location.country} />
          <DetailValue label="Postal code" value={location.postalCode} />
        </DetailSection>
      </article>
    </div>
  );
}
