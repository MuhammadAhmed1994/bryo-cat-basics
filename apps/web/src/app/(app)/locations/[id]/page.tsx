"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/api";
import { Banner, EmptyState, Spinner, StatusDot, Toast } from "@/components/ui";
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
  createdAt?: string;
  updatedAt?: string;
}

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await apiFetch<LocationDto>(`/locations/${params.id}`);
      setLocation(data);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 404) {
          setNotFound(true);
        } else {
          setError(e.message);
        }
      } else {
        setError("Couldn't load this location. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // Detect arrival from edit via ?updated=1
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("updated") === "1") {
        setShowUpdatedToast(true);
        // remove the flag from the URL without reloading
        params.delete("updated");
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-dismiss the success toast after ~5s
  useEffect(() => {
    if (!showUpdatedToast) return;
    const t = setTimeout(() => setShowUpdatedToast(false), 5000);
    return () => clearTimeout(t);
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
        message="The location you are looking for doesn't exist or may have been removed."
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
        {error && <Banner kind="error">{error}</Banner>}
        <button type="button" className="btn btn--ghost self-start" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showUpdatedToast && <Toast message="Location updated successfully" />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex items-center gap-2">
          <Link href="/locations" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-semibold text-brand">{location.name}</h1>
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

      {error && (
        <Banner kind="error">
          {error} <button className="link ml-2" onClick={() => void load()}>Retry</button>
        </Banner>
      )}

      <Section title="Details">
        <Detail label="Company" value={location.companyId ?? null} />
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
