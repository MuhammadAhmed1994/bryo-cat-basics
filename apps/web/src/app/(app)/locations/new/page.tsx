'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banner, Spinner, Toast } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { ApiError } from '@/lib/api';
import {
  LocationForm,
  type LocationFormValues,
  toLocationPayload,
} from '@/features/locations/location-form';
import { createLocation, getActiveCompanies } from '@/features/locations/locations-api';
import type { Company } from '@/lib/types';

/** Add an Active Location and return to the list after a successful save. */
export default function NewLocationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let current = true;
    getActiveCompanies()
      .then((activeCompanies) => {
        if (current) setCompanies(activeCompanies);
      })
      .catch(() => {
        if (current) setOptionsError(true);
      })
      .finally(() => {
        if (current) setOptionsLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createLocation(toLocationPayload(values));
      setSuccess(true);
      router.push('/locations');
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Location could not be saved. Check the form and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back to Locations"
          className="text-brand"
          onClick={() => router.push('/locations')}
        >
          <ChevronLeftIcon />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-brand">Add Location</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Create a location and add its contact and address details.
          </p>
        </div>
      </header>

      {optionsLoading ? (
        <Spinner label="Loading form options" />
      ) : (
        <>
          {optionsError && (
            <Banner kind="error">Company options could not be loaded. You can still create a Location without a Company.</Banner>
          )}
          <LocationForm
            companies={companies}
            submitting={submitting}
            formError={formError}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/locations')}
          />
        </>
      )}

      {success && <Toast message="Location created successfully." />}
    </div>
  );
}
