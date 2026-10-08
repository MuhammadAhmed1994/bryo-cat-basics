'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, EmptyState } from '@/components/ui';
import { LocationForm, LocationLoading, LocationRecord, locationToForm } from '@/features/locations/location-form';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<LocationRecord>(`/locations/${params.id}`)
      .then(setLocation)
      .catch((reason) => setError(reason instanceof ApiError && reason.status === 404 ? 'Location not found.' : 'Location could not be loaded. Try again.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LocationLoading />;
  if (!location) {
    if (error === 'Location not found.') {
      return <EmptyState title="Location not found" message="This Location may have been removed or is no longer available." action={<button className="btn btn--primary" onClick={() => router.push('/locations')}>Back to Locations</button>} />;
    }
    return <div className="flex flex-col gap-4"><Banner kind="error">{error ?? 'Location could not be loaded.'}</Banner><button className="btn btn--ghost self-start" onClick={() => router.push('/locations')}>Back to Locations</button></div>;
  }

  return <LocationForm mode="edit" locationId={location.id} initialValues={locationToForm(location)} currentCompany={location.company} />;
}
