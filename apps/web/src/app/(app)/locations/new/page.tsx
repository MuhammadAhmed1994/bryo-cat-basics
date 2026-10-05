'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { ChevronLeftIcon } from '@/components/icons';
import {
  EMPTY_LOCATION_FORM,
  LocationForm,
  LocationFormValues,
  toLocationPayload,
} from '@/features/locations/location-form';

export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/locations', { method: 'POST', body: toLocationPayload(values) });
      // Navigate back to list with a success hint param (see reviewer note L-1).
      router.push('/locations?added=1');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'We could not save this location.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back"
          className="text-brand"
          onClick={() => router.push('/locations')}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>

      <LocationForm
        initialValues={EMPTY_LOCATION_FORM}
        submitLabel="Save Location"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
