'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { Banner, Spinner, StatusDot, Toast } from '@/components/ui';
import { getLocation, setLocationStatus } from './location-api';
import type { Location } from './location-types';

interface LocationDetailsProps {
  id: string;
}

type LocationWithCompany = Location & {
  companyName?: string | null;
  company?: { name?: string | null } | null;
};

export function LocationDetails({ id }: LocationDetailsProps) {
  const [location, setLocation] = useState<LocationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setLocation(null);
    setError(null);
    setStatusError(null);
    getLocation(id)
      .then((record) => {
        if (current) setLocation(record as LocationWithCompany);
      })
      .catch((err: unknown) => {
        if (current) {
          setError(err instanceof ApiError ? err.message : 'This location could not be loaded.');
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function toggleStatus() {
    if (!location || updatingStatus) return;
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      // Keep the complete API response so the detail view uses the server's
      // authoritative status and updated audit values.
      const updated = await setLocationStatus(location.id, { isActive: !location.isActive });
      setLocation(updated as LocationWithCompany);
      setToast(updated.message);
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : 'We could not update this location.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <section className="card" aria-label="Location details">
        <Spinner label="Loading location" />
      </section>
    );
  }

  // A failed or unavailable record never falls through to previously loaded data.
  if (!location || location.id !== id) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'This location could not be loaded.'}</Banner>
        <Link className="link" href="/locations">
          Back to locations
        </Link>
      </div>
    );
  }

  const company = location.companyName ?? location.company?.name ?? location.companyId;

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link className="link" href="/locations">Locations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Location details</span>
      </nav>

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-ink-soft">Location details</p>
          <h1 className="break-words text-2xl font-semibold text-ink">{location.name}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn--ghost" href="/locations">
            Back to locations
          </Link>
          <Link className="btn btn--primary" href={`/locations/${location.id}/edit`}>
            Edit location
          </Link>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void toggleStatus()}
            disabled={updatingStatus}
          >
            {updatingStatus ? 'Updating…' : location.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </header>

      {statusError && <Banner kind="error">{statusError}</Banner>}

      <section className="card px-7 py-6" aria-labelledby="location-information-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="location-information-title" className="text-lg font-semibold text-ink">
            Location information
          </h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-sm text-ink">
            <StatusDot active={location.isActive} />
            <span>Status: {location.isActive ? 'Active' : 'Inactive'}</span>
          </span>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
          <Detail label="Location name" value={location.name} />
          <Detail label="Phone" value={location.phone} />
          <Detail label="Associated company" value={company} />
          <Detail label="City" value={location.city} />
          <Detail label="State / Province" value={location.stateProvince} />
          <Detail label="Country" value={location.country} />
        </dl>
      </section>

      <section className="card px-7 py-6" aria-labelledby="audit-information-title">
        <h2 id="audit-information-title" className="text-lg font-semibold text-ink">
          Audit information
        </h2>
        <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-ink-soft">Created</dt>
            <dd className="m-0 mt-1 text-sm text-ink">
              <time dateTime={location.createdAt}>{formatAuditDate(location.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-soft">Last updated</dt>
            <dd className="m-0 mt-1 text-sm text-ink">
              <time dateTime={location.updatedAt}>{formatAuditDate(location.updatedAt)}</time>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-soft">
          Audit timestamps are displayed in the existing app date/time format.
        </p>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{value?.trim() || 'None'}</dd>
    </div>
  );
}

/** Timestamps are stored in UTC and formatted for display in the app locale. */
function formatAuditDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
