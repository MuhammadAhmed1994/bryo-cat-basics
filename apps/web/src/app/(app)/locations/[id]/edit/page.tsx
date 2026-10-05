'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import {
  LocationDTO,
  LocationForm,
  LocationFormValues,
  SelectedCompanyOption,
  locationToForm,
  toLocationPayload,
} from '@/features/locations/location-form';
import { Company } from '@/lib/types';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [initialCompany, setInitialCompany] = useState<SelectedCompanyOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setFormError(null);
      try {
        const location = await apiFetch<LocationDTO>(`/locations/${params.id}`);
        if (!mounted) return;
        setInitialValues(locationToForm(location));
        if (location.companyId) {
          try {
            const company = await apiFetch<Company>(`/companies/${location.companyId}`);
            if (!mounted) return;
            setInitialCompany({ id: company.id, name: company.name, isActive: company.isActive });
          } catch {
            // If the company request fails, the association is still present by id.
            setInitialCompany(null);
          }
        } else {
          setInitialCompany(null);
        }
      } catch (error) {
        if (!mounted) return;
        setFormError(error instanceof ApiError ? error.message : 'We could not load this location.');
        setInitialValues(null);
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
      router.push(`/locations/${params.id}?updated=1`);
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
        initialCompanyOption={initialCompany}
        submitLabel="Save Changes"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/locations/${params.id}`)}
      />
    </div>
  );
}
