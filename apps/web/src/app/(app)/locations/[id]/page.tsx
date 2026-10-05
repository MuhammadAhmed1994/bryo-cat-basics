"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { Banner, EmptyState, Spinner, StatusDot, Toast, Truncated } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";
import { Company } from "@/lib/types";

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

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showArrivalToast = useMemo(() => {
    const v = search?.get("updated");
    return v === "1" || v === "true" || v === "success";
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const loc = await apiFetch<LocationDto>(`/locations/${params.id}`);
      setLocation(loc);
      if (loc.companyId) {
        try {
          const company = await apiFetch<Company>(`/companies/${loc.companyId}`);
          setCompanyName(company.name);
        } catch {
          setCompanyName(null);
        }
      } else {
        setCompanyName(null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't load this location.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (showArrivalToast) setToast("Location updated successfully");
  }, [showArrivalToast]);

  // Auto-dismiss toasts after ~5s per design.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

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
        message=""
        action={
          <Link className="btn btn--ghost" href="/locations">
            Back to Locations
          </Link>
        }
      />
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? "Couldn't load this location. Please try again."}</Banner>
        <button type="button" className="btn btn--ghost w-max" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/locations" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="truncate text-xl font-semibold text-brand" title={location.name}>
            <Truncated value={location.name} />
          </h1>
          <span className="ml-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={location.status === "ACTIVE"} />
            {location.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>

        <Link className="btn btn--ghost" href={`/locations/${location.id}/edit`}>
          Edit Location
        </Link>
      </header>

      {error && (
        <Banner kind="error">
          {error} <button className="link ml-2" onClick={() => void load()}>Retry</button>
        </Banner>
      )}

      <Section title="Details">
        <Detail label="Company" value={companyName} />
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
  return (
    <div>
      <dt className="text-xs font-medium text-brand">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{value?.trim() ? value : '-'}</dd>
    </div>
  );
}
