'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationForm, EMPTY_LOCATION_FORM, LocationFormValues } from '@/features/locations/location-form';
import { ChevronLeftIcon } from '@/components/icons';

export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(_values: LocationFormValues) {
    // Real implementation is covered by other tasks/endpoints.
    setSubmitting(true);
    setFormError(null);
    try {
      // TODO: POST /api/locations then navigate to /locations with success toast
      router.push('/locations');
    } catch (e) {
      setFormError('We could not save this location.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button type="button" aria-label="Back" className="text-brand" onClick={() => router.push('/locations')}>
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
