'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Paginated } from '@/lib/types';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon, LocationIcon } from '@/components/icons';
import {
  LocationCompanyOption,
  LocationForm,
  LocationFormValues,
  SavedLocation,
  locationToForm,
  toLocationPayload,
} from '@/features/locations/location-form';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [companies, setCompanies] = useState<LocationCompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SavedLocation>(`/locations/${params.id}`)
      .then(setLocation)
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Location not found.'))
      .finally(() => setLoading(false));

    apiFetch<Paginated<LocationCompanyOption>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => setCompanies(result.data.filter((company) => company.isActive)))
      .catch((error) => setCompaniesError(error instanceof Error ? error.message : 'Unable to load Companies.'))
      .finally(() => setCompaniesLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => router.push('/locations'), 1000);
    return () => window.clearTimeout(timer);
  }, [successMessage, router]);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch(`/locations/${params.id}`, {
        method: 'PATCH',
        body: toLocationPayload(values),
      });
      setSuccessMessage('Changes saved.');
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? `A Location with the name “${values.name.trim()}” already exists. Choose a different name.`
          : error instanceof ApiError
            ? error.message
            : 'Changes could not be saved. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <section className="card"><Spinner label="Loading Location" /></section>;
  }

  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{loadError ?? 'Location not found.'}</Banner>
        <Link href="/locations" className="link">Back to Locations</Link>
      </div>
    );
  }

  // Keep the saved association available even when the Company's active status differs.
  const companyOptions = [...companies];
  if (location.company && !companyOptions.some((company) => company.id === location.company?.id)) {
    companyOptions.push({ ...location.company });
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card px-6 py-5">
        <Link href="/locations" className="link--muted inline-flex items-center gap-2">
          <ChevronLeftIcon /> Back to Locations
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-brand-light bg-brand-light text-brand"><LocationIcon /></span>
          <div>
            <h1 className="m-0 text-2xl font-semibold text-ink">Edit Location</h1>
            <p className="mt-1 text-sm text-ink-soft">Your saved details are shown below.</p>
          </div>
        </div>
      </header>

      <LocationForm
        initialValues={locationToForm(location)}
        companies={companyOptions}
        companiesLoading={companiesLoading}
        companiesError={companiesError}
        submitLabel="Save Changes"
        submitting={submitting}
        formError={formError}
        successMessage={successMessage}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
