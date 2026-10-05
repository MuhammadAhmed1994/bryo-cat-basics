"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { Banner, EmptyState, Spinner, StatusDot, Toast, Truncated } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";
import type { LocationDTO } from "@/features/locations/location-form";
import type { Company } from "@/lib/types";

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showUpdatedToast = useMemo(() => {
    const updated = searchParams?.get("updated");
    return !!(updated && updated !== "0" && updated !== "false");
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setCompanyName(null);
    try {
      const loc = await apiFetch<LocationDTO>(`/locations/${params.id}`);
      setLocation(loc);
      if (loc.companyId) {
        try {
          const comp = await apiFetch<Company>(`/companies/${loc.companyId}`);
          setCompanyName(comp.name);
        } catch {
          // If the company fetch fails, the association id exists but we show a dash per spec patterns
          setCompanyName(null);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setLocation(null);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't load this location. Please try again.");
        setLocation(null);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Success toast on arrival from edit (AC-13). Auto-dismiss ~5s.
  useEffect(() => {
    if (!showUpdatedToast) return;
    setToast("Location updated successfully");
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [showUpdatedToast]);

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
          <Link href="/locations" className="link">
            Back to Locations
          </Link>
        }
      />
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        {error && <Banner kind="error">{error}</Banner>}
        <button type="button" className="btn btn--ghost self-start" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const isActive = location.status === "ACTIVE";

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/locations" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-semibold text-brand truncate">
            <Truncated value={location.name} />
          </h1>
          <span className="ml-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={isActive} />
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <Link className="btn btn--ghost" href={`/locations/${location.id}/edit`}>
          Edit Location
        </Link>
      </header>

      {error && (
        <div className="flex items-center gap-3">
          <Banner kind="error">{error}</Banner>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <Section title="Details">
        <Detail label="Company" value={companyName ?? (location.companyId ? null : "-")} />
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

function Detail({ label, value }: { label: string; value: string | null | undefined | "-" }) {
  const display = typeof value === "string" ? (value?.trim() ? value : "-") : "-";
  return (
    <div>
      <dt className="text-xs font-medium text-brand">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{display}</dd>
    </div>
  );
}
