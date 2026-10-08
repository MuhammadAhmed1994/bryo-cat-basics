'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import {
  getActiveCompanies,
  getLocation,
  updateLocation,
  type Location,
} from '@/features/locations/locations-api';
import {
  LocationForm,
  locationToForm,
  toLocationPayload,
  type LocationFormValues,
} from '@/features/locations/location-form';
import type { Company } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';

/** Edit an existing Location, retaining the form values if an API update fails. */
export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getLocation(params.id), getActiveCompanies()])
      .then(([savedLocation, activeCompanies]) => {
        if (!mounted) return;
        setLocation(savedLocation);
        setCompanies(activeCompanies);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(error instanceof Error ? error.message : 'Location could not be loaded. Try again.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      // PATCHing the current name is intentional: uniqueness excludes this Location.
      await updateLocation(params.id, toLocationPayload(values));
      router.push(`/locations/${encodeURIComponent(params.id)}?updated=1`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Changes could not be saved. Check the form and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or is no longer available."
        action={<Link className="link" href="/locations">Locations</Link>}
      />
    );
  }

  if (loadError || !location) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Banner kind="error">{loadError ?? 'Location could not be loaded. Try again.'}</Banner>
        <button type="button" className="btn btn--ghost" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex flex-col items-start gap-2 px-7 py-5">
        <Link className="link text-sm" href={`/locations/${encodeURIComponent(params.id)}`}>
          ‹ Back to Location Details
        </Link>
        <h1 className="m-0 text-xl font-semibold text-brand">Edit Location</h1>
        <p className="m-0 text-sm text-ink-soft">Update the saved details for this location.</p>
      </header>

      <LocationForm
        initialValues={locationToForm(location)}
        companies={companies}
        submitLabel="Save Changes"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}
      />
    </div>
  );
}
