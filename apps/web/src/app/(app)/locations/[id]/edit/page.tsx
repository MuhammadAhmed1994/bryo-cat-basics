"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { Company } from "@/lib/types";
import { Banner, Spinner } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/icons";
import { LocationForm, LocationFormValues } from "@/features/locations/location-form";

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

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [initialCompany, setInitialCompany] = useState<Pick<Company, "id" | "name" | "isActive"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const location = await apiFetch<LocationDto>(`/locations/${params.id}`);
        if (cancelled) return;
        setInitialValues({
          name: location.name,
          companyId: location.companyId,
          phone: location.phone ?? "",
          contactName: location.contactPersonName ?? "",
          contactPhone: location.contactPersonPhone ?? "",
          addressLine1: location.addressLine1 ?? "",
          addressLine2: location.addressLine2 ?? "",
          geo: {
            country: location.country ?? "",
            stateProvince: location.stateProvince ?? "",
            city: location.city ?? "",
          },
          postalCode: location.postalCode ?? "",
        });

        if (location.companyId) {
          try {
            const company = await apiFetch<Company>(`/companies/${location.companyId}`);
            if (!cancelled) setInitialCompany({ id: company.id, name: company.name, isActive: company.isActive });
          } catch (e) {
            // If the company fetch fails, keep editing without its label.
          }
        } else {
          setInitialCompany(null);
        }
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "We could not load this location.";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading location" />
      </div>
    );
  }

  if (!initialValues) {
    return <Banner kind="error">{error ?? "Location not found."}</Banner>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back"
          className="text-brand"
          onClick={() => router.push(`/locations/${params.id}`)}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
      </header>

      <LocationForm
        initialValues={initialValues}
        initialCompany={initialCompany}
        submitLabel="Save Changes"
        onSubmit={() => {}}
        onCancel={() => router.push(`/locations/${params.id}`)}
      />
    </div>
  );
}
