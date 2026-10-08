'use client';

import { useRouter } from 'next/navigation';
import { LocationForm } from '@/features/locations/location-form';

/** Create a Location and return to the Locations list on success. */
export default function NewLocationPage() {
  const router = useRouter();

  return (
    <LocationForm
      onCancel={() => router.push('/locations')}
      onSaved={() => router.push('/locations')}
    />
  );
}
