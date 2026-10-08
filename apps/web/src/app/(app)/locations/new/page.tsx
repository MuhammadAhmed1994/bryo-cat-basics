'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/icons';
import { LocationForm } from '@/features/locations/location-form';
import { createLocation } from '@/features/locations/location-api';

/** Add a Location and return to the list with a success notice for its toast. */
export default function NewLocationPage() {
  const router = useRouter();

  async function handleSubmit(values: Parameters<typeof createLocation>[0]) {
    const result = await createLocation(values);
    const message = result.message || 'Location added successfully.';
    router.push(`/locations?success=${encodeURIComponent(message)}`);
  }

  function returnToList() {
    router.push('/locations');
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button type="button" aria-label="Back to Locations" className="text-brand" onClick={returnToList}>
          <ChevronLeftIcon />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-brand">Add Location</h1>
          <p className="hint">Add a new location and its identifying details.</p>
        </div>
      </header>
      <LocationForm onSubmit={handleSubmit} onCancel={returnToList} />
    </div>
  );
}
