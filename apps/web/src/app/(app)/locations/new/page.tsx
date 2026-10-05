'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationForm, EMPTY_LOCATION_FORM, LocationFormValues } from '@/features/locations/location-form';
import { ChevronLeftIcon } from '@/components/icons';

export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(_values: LocationFormValues) {
    // Out of scope for this task — the API call and navigation are covered by a later story.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
    }, 10);
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
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
