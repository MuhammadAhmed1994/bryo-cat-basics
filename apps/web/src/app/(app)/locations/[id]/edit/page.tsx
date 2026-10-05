'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { LocationForm, LocationFormValues, locationToForm, toLocationPayload } from '@/features/locations/location-form';
import { Company } from '@/lib/types';

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

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [currentCompany, setCurrentCompany] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const loc = await apiFetch<LocationDto>(`/locations/${params.id}`);
        if (!mounted) return;
        setInitialValues(locationToForm(loc));
        if (loc.companyId) {
          // Pull the current company so an inactive company can be retained on Edit.
          const company = await apiFetch<Company>(`/companies/${loc.companyId}`);
          if (mounted) {
            setCurrentCompany({ id: company.id, name: company.name, isActive: company.isActive });
          }
        }
      } catch (error) {
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
      await apiFetch(`/locations/${params.id}`, { method: 'PATCH', body: toLocationPayload(values) });
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
        initialValues={initialValues}
        currentCompany={currentCompany}
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
