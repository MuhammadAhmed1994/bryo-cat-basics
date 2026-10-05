'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, Spinner } from '@/components/ui';
import {
  EMPTY_LOCATION_FORM,
  LocationForm,
  LocationFormValues,
  StoredCompanyInfo,
  locationToForm,
} from '@/features/locations/location-form';
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

function toPayload(values: LocationFormValues) {
  return {
    name: values.name.trim(),
    companyId: values.companyId ?? null,
    phone: values.phone.trim() || null,
    contactPersonName: values.contactName.trim() || null,
    contactPersonPhone: values.contactPhone.trim() || null,
    addressLine1: values.addressLine1.trim() || null,
    addressLine2: values.addressLine2.trim() || null,
    country: values.geo.country.trim() || null,
    stateProvince: values.geo.stateProvince.trim() || null,
    city: values.geo.city.trim() || null,
    postalCode: values.postalCode.trim() || null,
  };
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [initialCompany, setInitialCompany] = useState<StoredCompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const location = await apiFetch<LocationDto>(`/locations/${params.id}`);
        if (!mounted) return;
        setInitialValues(locationToForm(location));
        if (location.companyId) {
          try {
            const company = await apiFetch<CompanyDto>(`/companies/${location.companyId}`);
            if (mounted) setInitialCompany(company);
          } catch {
            // If the company lookup fails we still allow editing other fields.
          }
        }
      } catch (error) {
        if (mounted)
          setFormError(error instanceof ApiError ? error.message : 'We could not load this location.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch(`/locations/${params.id}`, { method: 'PATCH', body: toPayload(values) });
      router.push(`/locations/${params.id}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'We could not update this location.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading location" />
      </div>
    );
  }

  if (!initialValues) {
    return <Banner kind="error">{formError ?? 'Location not found.'}</Banner>;
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
        initialValues={initialValues ?? EMPTY_LOCATION_FORM}
        initialCompany={initialCompany}
        submitLabel="Save Changes"
        submitting={submitting}
        formError={formError}
        requireChange
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/locations/${params.id}`)}
      />
    </div>
  );
}
