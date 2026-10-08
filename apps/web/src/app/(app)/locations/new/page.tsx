'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { createLocation, LocationInput } from '@/features/locations/location-api';
import { LocationForm } from '@/features/locations/location-form';
import { ChevronLeftIcon } from '@/components/icons';

export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: LocationInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createLocation(values);
      // The list route can consume this notice when it is mounted after navigation.
      sessionStorage.setItem('location-success', 'Location added successfully');
      router.push('/locations?success=Location%20added%20successfully');
    } catch (cause) {
      setFormError(
        cause instanceof ApiError
          ? cause.message
          : 'Location could not be created. Review the highlighted fields and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-5 py-5 sm:px-7">
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
          <p className="mt-1 text-sm text-ink-soft">Add a new location and its identifying details.</p>
        </div>
      </header>
      <LocationForm
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
