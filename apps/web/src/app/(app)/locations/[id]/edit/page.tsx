'use client';

import { useRouter } from 'next/navigation';
import { LocationForm } from '@/features/locations/location-form';

/** Edit the Location identified by the route and return to the list on success. */
export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <LocationForm
      locationId={params.id}
      onCancel={() => router.push('/locations')}
      onSaved={() => router.push('/locations')}
    />
  );
}
