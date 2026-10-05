'use client';

import { useRouter } from 'next/navigation';
import { LocationForm } from '@/features/locations/location-form';
import { ChevronLeftIcon } from '@/components/icons';

export default function NewLocationPage() {
  const router = useRouter();

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

      <LocationForm submitLabel="Save Location" />
    </div>
  );
}
