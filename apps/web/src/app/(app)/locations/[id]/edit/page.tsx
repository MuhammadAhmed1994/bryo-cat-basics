'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Banner, Spinner, Toast } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import type { Company } from '@/lib/types';
import {
  getLocation,
  listActiveCompanies,
  updateLocation,
  type Location,
} from '@/features/locations/locations-api';
import { LocationForm, type LocationFormValues } from '@/features/locations/location-form';

function toFormValues(location: Location): LocationFormValues {
  return {
    name: location.name ?? '',
    description: location.description ?? '',
    companyId: location.companyId ?? location.company?.id ?? '',
    phone: location.phone ?? '',
    contactPersonName: location.contactPersonName ?? '',
    contactPersonPhone: location.contactPersonPhone ?? '',
    contactPersonEmail: location.contactPersonEmail ?? '',
    addressLine1: location.addressLine1 ?? '',
    addressLine2: location.addressLine2 ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    postalCode: location.postalCode ?? '',
  };
}

/** Edit a saved Location using the same validated form as Location creation. */
export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setFormError(null);
    try {
      const [location, companyPage] = await Promise.all([
        getLocation(params.id),
        listActiveCompanies(),
      ]);
      setInitialValues(toFormValues(location));
      setCompanies(companyPage.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
      } else {
        setFormError(error instanceof Error ? error.message : 'Location could not be loaded. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await updateLocation(params.id, {
        ...values,
        companyId: values.companyId || null,
      });
      setSuccess(true);
      // Keep the confirmation visible briefly before returning to the details screen.
      window.setTimeout(() => router.push(`/locations/${encodeURIComponent(params.id)}?updated=1`), 900);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Changes could not be saved. Check the form and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="card"><Spinner label="Loading Location" /></div>;
  }

  if (notFound) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="m-0 text-sm text-ink-soft">Location not found.</p>
        <Link href="/locations" className="link">Locations</Link>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{formError ?? 'Location could not be loaded. Try again.'}</Banner>
        <button type="button" className="btn btn--ghost self-start" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="card flex items-center gap-2 px-6 py-5 sm:px-7">
        <button
          type="button"
          aria-label="Back to Location Details"
          className="text-brand"
          onClick={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}
        >
          <ChevronLeftIcon />
        </button>
        <div>
          <h1 className="m-0 text-xl font-semibold text-ink">Edit Location</h1>
          <p className="m-0 mt-1 text-sm text-ink-soft">Update the saved details for this location.</p>
        </div>
      </header>

      {success && <Toast message="Location updated successfully." />}

      <LocationForm
        initialValues={initialValues}
        companies={companies}
        submitLabel="Save Changes"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}
      />
    </div>
  );
}
