'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, LocationIcon } from '@/components/icons';
import { ApiError, apiFetch } from '@/lib/api';
import { Paginated } from '@/lib/types';
import {
  LocationCompanyOption,
  LocationForm,
  LocationFormValues,
  toLocationPayload,
} from '@/features/locations/location-form';

export default function NewLocationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<LocationCompanyOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<LocationCompanyOption>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => setCompanies(result.data.filter((company) => company.isActive)))
      .catch((error) => setCompaniesError(error instanceof Error ? error.message : 'Unable to load Companies.'))
      .finally(() => setCompaniesLoading(false));
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => router.push('/locations'), 1000);
    return () => window.clearTimeout(timer);
  }, [successMessage, router]);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/locations', { method: 'POST', body: toLocationPayload(values) });
      setSuccessMessage('Location created.');
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? `A Location with the name “${values.name.trim()}” already exists. Choose a different name.`
          : error instanceof ApiError
            ? error.message
            : 'Location could not be saved. Review the form and try again.',
      );
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="m-0 text-2xl font-semibold text-ink">Add Location</h1>
            <p className="mt-1 text-sm text-ink-soft">Create and associate a location in your workspace.</p>
          </div>
        </div>
      </header>

      <LocationForm
        companies={companies}
        companiesLoading={companiesLoading}
        companiesError={companiesError}
        submitLabel="Save Location"
        submitting={submitting}
        formError={formError}
        successMessage={successMessage}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
