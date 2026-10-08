'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon, LocationIcon } from '@/components/icons';
import { LocationForm, LocationRecord } from '@/features/locations/location-form';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<LocationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<LocationRecord>(`/locations/${params.id}`)
      .then((record) => { if (active) setLocation(record); })
      .catch((reason) => {
        if (active) setError(reason instanceof ApiError ? reason.message : 'Location could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;
  if (!location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'Location not found.'}</Banner>
        <Link href="/locations" className="link">Back to Locations</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-1 py-4 sm:px-4">
      <Link href="/locations" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ChevronLeftIcon /> Back to Locations
      </Link>
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-brand-light text-brand"><LocationIcon /></span>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Edit Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Your saved details are shown below.</p>
        </div>
      </header>
      <LocationForm locationId={location.id} initialLocation={location} submitLabel="Save Changes" />
    </div>
  );
}
