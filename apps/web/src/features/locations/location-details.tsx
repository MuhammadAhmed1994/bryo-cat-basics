'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Banner, Spinner, StatusDot, Toast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api';
import { getLocation, setLocationStatus } from './location-api';
import type { Location } from './location-types';

interface LocationDetailsProps {
  id: string;
}

/** Location detail view with audit data and inline status management. */
export function LocationDetails({ id }: LocationDetailsProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLocation(null);
    setCompanyName(null);
    setError(null);
    try {
      const result = await getLocation(id);
      setLocation(result);
      if (result.companyId) {
        try {
          const company = await apiFetch<{ name: string }>(
            `/companies/${encodeURIComponent(result.companyId)}`,
          );
          setCompanyName(company.name);
        } catch {
          // Company information is supplementary; keep the location available if it fails.
          setCompanyName(result.companyId);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'This location could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function toggleStatus() {
    if (!location || updatingStatus) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const updated = await setLocationStatus(location.id, { isActive: !location.isActive });
      setLocation(updated);
      setToast(updated.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not update this location.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <Spinner label="Loading location" />
      </section>
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'This location could not be loaded.'}</Banner>
        <Link className="link" href="/locations">
          Back to locations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-ink-soft">Location details</p>
          <h1 className="break-words text-2xl font-semibold text-ink">{location.name}</h1>
          <span className="mt-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={location.isActive} />
            {location.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn--ghost" href="/locations">
            Back to locations
          </Link>
          <Link className="btn btn--primary" href={`/locations/${encodeURIComponent(location.id)}/edit`}>
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

      {error && <Banner kind="error">{error}</Banner>}

      <section className="card px-7 py-6" aria-labelledby="location-information-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="location-information-heading" className="text-lg font-semibold text-ink">
            Location information
          </h2>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              location.isActive
                ? 'border-emerald-200 bg-emerald-50 text-brand-dark'
                : 'border-line bg-canvas text-ink-soft'
            }`}
          >
            <StatusDot active={location.isActive} />
            Status: {location.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
          <Detail label="Location name" value={location.name} />
          <Detail label="Phone" value={location.phone} emptyValue="None" />
          <Detail label="Associated company" value={location.companyId ? companyName : null} emptyValue="None" />
          <Detail label="City" value={location.city} />
          <Detail label="State / Province" value={location.stateProvince} />
          <Detail label="Country" value={location.country} />
        </dl>
      </section>

      <section className="card px-7 py-6" aria-labelledby="audit-information-heading">
        <h2 id="audit-information-heading" className="text-lg font-semibold text-ink">
          Audit information
        </h2>
        <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-ink-muted">Created</dt>
            <dd className="m-0 mt-1 text-sm text-ink">
              <time dateTime={location.createdAt}>{formatDate(location.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-muted">Last updated</dt>
            <dd className="m-0 mt-1 text-sm text-ink">
              <time dateTime={location.updatedAt}>{formatDate(location.updatedAt)}</time>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-muted">
          Audit timestamps are displayed in the existing app date/time format.
        </p>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  emptyValue = '—',
}: {
  label: string;
  value: string | null;
  emptyValue?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{value?.trim() || emptyValue}</dd>
    </div>
  );
}

/** Match the Companies detail screen's established display-date convention. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}
