'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const loc = await apiFetch<LocationDto>(`/locations/${params.id}`);
      setLocation(loc);
      if (loc.companyId) {
        try {
          const comp = await apiFetch<CompanyDto>(`/companies/${loc.companyId}`);
          setCompany(comp);
        } catch {
          // Company fetch failure should not block the details view.
          setCompany(null);
        }
      } else {
        setCompany(null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't load this location. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Success toast on arrival from edit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const fromEdit = sp.get('updated');
    const ss = window.sessionStorage.getItem('nbryo.locations.updated');
    if (fromEdit === '1' || ss === '1') {
      setToast('Location updated successfully');
      if (fromEdit === '1') {
        sp.delete('updated');
        const url = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
        window.history.replaceState({}, '', url);
      }
      window.sessionStorage.removeItem('nbryo.locations.updated');
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const isActive = useMemo(() => location?.status === 'ACTIVE', [location?.status]);

  if (loading) {
    return (
      <div className="card">
        {toast && <Toast message={toast} />}
        <Spinner label="Loading location" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        {toast && <Toast message={toast} />}
        <EmptyState title="Location not found." message="" action={<Link className="link" href="/locations">Back to Locations</Link>} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {toast && <Toast message={toast} />}
        <Banner kind="error">{error}</Banner>
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
      {toast && <Toast message={toast} />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/locations" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-semibold text-brand">
            <Truncated value={location.name} />
          </h1>
          <span className="ml-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={isActive} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className="btn btn--ghost" href={`/locations/${location.id}/edit`}>
            Edit Location
          </Link>
        </div>
      </header>

      <Section title="Details" note="Read-only view — use Edit Location to change any value.">
        <Detail label="Company" value={company?.name ?? '-'} />
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

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="card px-7 py-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
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
