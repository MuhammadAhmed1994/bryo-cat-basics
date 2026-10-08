'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Location, getLocation } from '@/features/locations/location-api';
import { Banner, EmptyState, Spinner, StatusDot, Toast } from '@/components/ui';

interface LocationDetailProps {
  id: string;
  showSuccess?: boolean;
}

function display(value: string | null | undefined): string {
  return value?.trim() ? value : '-';
}

export function LocationDetail({ id, showSuccess = false }: LocationDetailProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const result = await getLocation(id);
      if (requestId.current === currentRequest) setLocation(result);
    } catch (cause) {
      if (requestId.current !== currentRequest) return;
      setLocation(null);
      if (cause instanceof ApiError && cause.status === 404) {
        setNotFound(true);
      } else {
        setError('Location details could not be loaded. Try again.');
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  if (loading) {
    return <div className="card"><Spinner label="Loading Location" /></div>;
  }

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or may no longer be available."
        action={<Link className="btn btn--primary" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'Location details could not be loaded. Try again.'}</Banner>
        <button type="button" className="btn btn--primary self-start" onClick={() => void load()}>
          Retry
        </button>
        <Link className="link" href="/locations">Back to Locations</Link>
      </div>
    );
  }

  const active = location.status === 'ACTIVE';
  const companyName = location.company?.name;

  return (
    <div className="flex flex-col gap-4">
      {showSuccess && <Toast message="Location updated successfully." />}

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link href="/locations" className="link">Locations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Location Details</span>
      </nav>

      <header className="card flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7">
        <div>
          <h1 className="text-xl font-semibold text-brand">Location Details</h1>
          <p className="mt-1 text-sm text-ink-soft">Review the saved information for this location.</p>
        </div>
        <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(location.id)}/edit`}>
          Edit Location
        </Link>
      </header>

      <Link href="/locations" className="link self-start">← Back to Locations</Link>

      <article className="card overflow-hidden" aria-label="Location information">
        <header className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-5 sm:px-7">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary text-brand" aria-hidden="true">⌖</span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">Location</p>
            <h2 className="m-0 truncate text-lg font-semibold text-ink">{location.name}</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-sm font-medium text-ink">
            <StatusDot active={active} />
            {active ? 'Active' : 'Inactive'}
          </span>
        </header>

        <DetailSection title="Company & contact">
          <Detail label="Company" value={companyName} />
          <Detail label="Contact Person" value={location.contactPerson} />
          <Detail label="Location phone" value={location.phone} />
          <Detail label="Contact Person phone" value={location.contactPersonPhone} />
        </DetailSection>

        <DetailSection title="Address">
          <Detail label="Address line 1" value={location.addressLine1} />
          <Detail label="Address line 2" value={location.addressLine2} />
          <Detail label="City" value={location.city} />
          <Detail label="State/Province" value={location.stateProvince} />
          <Detail label="Country" value={location.country} />
          <Detail label="Postal code" value={location.postalCode} />
        </DetailSection>
      </article>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-5 last:border-b-0 sm:px-7" aria-label={title}>
      <h3 className="mb-4 text-base font-semibold text-ink">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm font-medium text-ink">{display(value)}</dd>
    </div>
  );
}
