'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, EmptyState, Spinner, StatusDot, Toast, Truncated } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';

type Location = {
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
  createdAt?: string;
  updatedAt?: string;
};

export default function LocationDetailsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const shouldShowToast = useMemo(() => {
    if (!searchParams) return false;
    const val = (key: string) => (Array.isArray(searchParams[key]) ? searchParams[key]?.[0] : searchParams[key]);
    return val('updated') === '1' || val('success') === '1';
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await apiFetch<Location>(`/locations/${params.id}`);
      setLocation(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setError("Couldn't load this location. Please try again.");
        }
      } else {
        setError("Couldn't load this location. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (shouldShowToast) setShowToast(true);
  }, [shouldShowToast]);

  useEffect(() => {
    if (!showToast) return;
    const id = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(id);
  }, [showToast]);

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading location" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This location does not exist or may have been removed."
        action={
          <Link className="btn btn--ghost" href="/locations">
            <ChevronLeftIcon /> Back to Locations
          </Link>
        }
      />
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">
          {error ?? "Couldn't load this location. Please try again."}
        </Banner>
        <div>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showToast && <Toast message="Location updated successfully" />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/locations" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="truncate text-xl font-semibold text-brand" title={location.name}>
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

      {error && <Banner kind="error">{error}</Banner>}

      <Section title="Details">
        <Detail label="Company" value={null /* No company name in payload; show '-' when none */} />
        <Detail label="Phone" value={location.phone ?? ''} />
        <Detail label="Contact Person" value={location.contactPersonName ?? ''} />
        <Detail label="Contact Person Phone" value={location.contactPersonPhone ?? ''} />
      </Section>

      <Section title="Address">
        <Detail label="Address Line 1" value={location.addressLine1 ?? ''} />
        <Detail label="Address Line 2" value={location.addressLine2 ?? ''} />
        <Detail label="City" value={location.city ?? ''} />
        <Detail label="State/Province" value={location.stateProvince ?? ''} />
        <Detail label="Country" value={location.country ?? ''} />
        <Detail label="Postal Code" value={location.postalCode ?? ''} />
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

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  const display = value && value.toString().trim() ? value : '-';
  return (
    <div>
      <dt className="text-xs font-medium text-brand">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{display}</dd>
    </div>
  );
}
