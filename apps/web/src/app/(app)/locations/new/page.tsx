'use client';

import { useRouter } from 'next/navigation';
import { LocationForm, LocationFormValues } from '@/features/locations/location-form';

export default function NewLocationPage() {
  const router = useRouter();

  function handleSubmit(values: LocationFormValues) {
    // In this task we focus on the form composition/behaviour and tests.
    // The actual POST will be wired in its own task; for now just noop and
    // keep parity with tests that mount the form itself.
    console.log('submit', values); // eslint-disable-line no-console
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card px-7 py-5">
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>

      <LocationForm submitLabel="Save Location" onSubmit={handleSubmit} onCancel={() => router.push('/locations')} />
    </div>
  );
}
