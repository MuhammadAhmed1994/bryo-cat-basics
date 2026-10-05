'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, EmptyState, Spinner, StatusDot, Toast, Truncated } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';

interface LocationDto {
  id: string;
  name: string;
  companyId: string | null;
  phone: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  postalCode: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface CompanyDto {
  id: string;
  name: string;
  isActive: boolean;
}

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCompany(null);
    try {
      const loc = await apiFetch<LocationDto>(`/locations/${params.id}`);
      setLocation(loc);
      if (loc.companyId) {
        try {
          const comp = await apiFetch<CompanyDto>(`/companies/${loc.companyId}`);
          setCompany(comp);
        } catch {
          // Company lookup failing should not block the page; show '-'.
          setCompany(null);
        }
      }
    } catch (err) {
      setLocation(null);
      setError(err instanceof ApiError ? err : new ApiError(500, "Couldn't load this location. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Show a success toast when arriving from edit (AC-13). Detected via a
  // transient sessionStorage flag or the `?updated=1` URL param.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('updated') === '1';
    const flag = window.sessionStorage.getItem('nbryo.locations.updated') === '1';
    if (fromQuery || flag) {
      setShowUpdatedToast(true);
      window.sessionStorage.removeItem('nbryo.locations.updated');
      const t = setTimeout(() => setShowUpdatedToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading location" />
      </div>
    );
  }

  if (error && error.status === 404) {
    return (
      <EmptyState
        title="Location not found."
        message=""
        action={
          <Link href="/locations" className="btn btn--ghost">
            <ChevronLeftIcon /> Back to Locations
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <Banner kind="error">{error.message}</Banner>
        <div>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="flex flex-col gap-4">
      {showUpdatedToast && <Toast message="Location updated successfully" />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex items-center gap-2">
          <Link href="/locations" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-semibold text-brand">
            <Truncated value={location.name} />
          </h1>
          <span className="ml-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={location.status === 'ACTIVE'} />
            {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className="btn btn--ghost" href={`/locations/${location.id}/edit`}>
            Edit Location
          </Link>
        </div>
      </header>

      <Section title="Details">
        <Detail label="Company" value={company?.name ?? (location.companyId ? undefined : '-')} />
        <Detail label="Phone" value={location.phone} />
        <Detail label="Contact Person" value={location.contactPersonName} />
        <Detail label="Contact Person Phone" value={location.contactPersonPhone} />
      </Section>

      <Section title="Address">
        <Detail label="Address Line 1" value={location.addressLine1} />
        <Detail label="Address Line 2" value={location.addressLine2} />
        <Detail label="City" value={location.city} />
        <Detail label="State/Province" value={location.stateProvince} />
        <Detail label="Country" value={location.country} />
        <Detail label="Postal Code" value={location.postalCode} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card px-7 py-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{children}</dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined | '-' }) {
  const display = typeof value === 'string' ? (value?.trim() ? value : '-') : value === '-' ? '-' : '-';
  return (
    <div>
      <dt className="text-xs font-medium text-brand">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{display}</dd>
    </div>
  );
}
