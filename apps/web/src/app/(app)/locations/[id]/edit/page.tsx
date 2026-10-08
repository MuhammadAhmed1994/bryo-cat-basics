'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Banner, Spinner } from '@/components/ui';
import { getLocation } from '@/features/locations/location-api';
import { LocationForm, locationToForm, type LocationFormValues } from '@/features/locations/location-form';
import type { Location } from '@/features/locations/location-types';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    getLocation(params.id)
      .then((location: Location) => current && setInitialValues(locationToForm(location)))
      .catch((error: unknown) => {
        if (current) setLoadError(error instanceof ApiError ? error.message : error instanceof Error ? error.message : '');
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [params.id]);

  if (loading) return <div className="card"><Spinner label="Loading location" /></div>;
  if (!initialValues) {
    return <div className="flex flex-col gap-4"><Banner kind="error">{loadError || 'Location information is unavailable.'}</Banner><Link className="link" href={`/locations/${params.id}`}>Back to location details</Link></div>;
  }

  return <LocationForm mode="edit" locationId={params.id} initialValues={initialValues} />;
}
