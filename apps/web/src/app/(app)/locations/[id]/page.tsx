"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { Banner, EmptyState, Spinner, StatusDot, Toast, Truncated } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";

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
  status: "ACTIVE" | "INACTIVE";
}

interface CompanyDto { id: string; name: string; isActive: boolean }

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();

  const [location, setLocation] = useState<LocationDto | null>(null);
  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
          setCompany(null);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) setError({ status: err.status, message: err.message });
      else setError({ status: 500, message: "We could not load this location." });
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  // Show success toast when arriving from edit
  useEffect(() => {
    if (searchParams?.get("updated") === "1") {
      setToast("Location updated successfully");
    }
  }, [searchParams]);

  // Auto-dismiss toast after ~5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !location) {
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
        message="This location may have been deleted or the link is incorrect."
        action={<Link className="btn btn--ghost" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error?.message ?? "We could not load this location."}</Banner>
        <button type="button" className="btn btn--ghost w-max" onClick={() => void load()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

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

      {error && <Banner kind="error">{error.message}</Banner>}

      <Section title="Details">
        <Detail label="Company" value={company?.name ?? null} />
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

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  const display = value !== null && value !== undefined && String(value).trim() !== "" ? String(value) : "-";
  return (
    <div>
      <dt className="text-xs font-medium text-brand">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{display}</dd>
    </div>
  );
}
