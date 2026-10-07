'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/icons';
import { LocationForm, LocationFormErrors, LocationFormValues, toLocationPayload } from '@/features/locations/location-form';
import { createLocation } from '@/features/locations/location-api';
import { ApiError } from '@/lib/api';

/** Add a new Location. A successful save returns to the Locations list. */
export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<LocationFormErrors>({});

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    setServerErrors({});
    try {
      await createLocation(toLocationPayload(values));
      router.push('/locations?success=Location%20added%20successfully');
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Location could not be created. Review the highlighted fields and try again.';
      const normalized = message.toLowerCase();
      const fieldErrors: LocationFormErrors = {};
      if (/name|duplicate|already exists|unique/.test(normalized)) fieldErrors.name = message;
      if (/phone/.test(normalized)) {
        if (/contact/.test(normalized)) fieldErrors.contactPersonPhone = message;
        else fieldErrors.phone = message;
      }
      if (/country|state|province|city|geograph/.test(normalized)) {
        fieldErrors.country = message;
        fieldErrors.stateProvince = message;
        fieldErrors.city = message;
      }
      setServerErrors(fieldErrors);
      setFormError(message || 'Location could not be created. Review the highlighted fields and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <Link href="/locations" aria-label="Back to Locations" className="text-brand">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>
      <p className="text-sm text-ink-soft">Add a new location and its identifying details.</p>
      <LocationForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
        submitting={submitting}
        formError={formError}
        serverErrors={serverErrors}
      />
    </div>
  );
}
