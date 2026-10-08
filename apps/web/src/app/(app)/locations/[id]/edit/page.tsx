'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import {
  LocationForm,
  LocationFormValues,
} from '@/features/locations/location-form';
import {
  getActiveCompanies,
  getLocation,
  Location,
  updateLocation,
} from '@/features/locations/locations-api';
import { Company } from '@/lib/types';

function locationToForm(location: Location): LocationFormValues {
  return {
    name: location.name,
    description: location.description ?? '',
    companyId: location.companyId ?? location.company?.id ?? '',
    phone: location.phone ?? '',
    contactPersonName: location.contactPersonName ?? '',
    contactPersonPhone: location.contactPersonPhone ?? '',
    contactPersonEmail: location.contactPersonEmail ?? '',
    addressLine1: location.addressLine1 ?? '',
    addressLine2: location.addressLine2 ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    postalCode: location.postalCode ?? '',
  };
}

function optionalValue(value: string): string | null {
  return value.trim() ? value : null;
}

/** Edit a saved Location while reusing the create form's validation and dependencies. */
export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setLoadError(null);
    Promise.all([getLocation(params.id), getActiveCompanies()])
      .then(([savedLocation, activeCompanies]) => {
        if (!active) return;
        setLocation(savedLocation);
        setCompanies(activeCompanies);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(error instanceof ApiError ? error.message : 'Location could not be loaded. Try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    setSaveSuccess(false);
    try {
      await updateLocation(params.id, {
        name: values.name,
        description: optionalValue(values.description),
        companyId: values.companyId || null,
        phone: optionalValue(values.phone),
        contactPersonName: optionalValue(values.contactPersonName),
        contactPersonPhone: optionalValue(values.contactPersonPhone),
        contactPersonEmail: optionalValue(values.contactPersonEmail),
        addressLine1: optionalValue(values.addressLine1),
        addressLine2: optionalValue(values.addressLine2),
        country: optionalValue(values.country),
        stateProvince: optionalValue(values.stateProvince),
        city: optionalValue(values.city),
        postalCode: optionalValue(values.postalCode),
      });
      setSaveSuccess(true);
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
        action={<Link className="btn btn--ghost" href="/locations">Locations</Link>}
      />
    );
  }

  if (loadError || !location) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{loadError ?? 'Location could not be loaded. Try again.'}</Banner>
        <Link className="btn btn--ghost self-start" href={`/locations/${encodeURIComponent(params.id)}`}>Back to Location Details</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-soft">
        <Link className="link" href={`/locations/${encodeURIComponent(params.id)}`}>Location Details</Link>
        <span aria-hidden="true">/</span>
        <span>Edit Location</span>
      </nav>
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back to Location Details"
          className="text-brand"
          onClick={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Update the saved details for this location.</p>
        </div>
      </header>
      {saveSuccess && <Banner kind="success">Location updated successfully.</Banner>}
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
