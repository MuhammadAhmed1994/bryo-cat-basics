'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

function toFormValues(location: Location): LocationFormValues {
  return {
    name: location.name,
    companyId: location.companyId ?? location.company?.id ?? '',
    contactPersonName: location.contactPersonName ?? '',
    contactPersonEmail: location.contactPersonEmail ?? '',
    contactPersonPhone: location.contactPersonPhone ?? '',
    phone: location.phone ?? '',
    addressLine1: location.addressLine1 ?? '',
    addressLine2: location.addressLine2 ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    postalCode: location.postalCode ?? '',
  };
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
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
    try {
      await updateLocation(params.id, {
        name: values.name,
        companyId: values.companyId || null,
        contactPersonName: values.contactPersonName || null,
        contactPersonEmail: values.contactPersonEmail || null,
        contactPersonPhone: values.contactPersonPhone || null,
        phone: values.phone || null,
        addressLine1: values.addressLine1 || null,
        addressLine2: values.addressLine2 || null,
        country: values.country || null,
        stateProvince: values.stateProvince || null,
        city: values.city || null,
        postalCode: values.postalCode || null,
      });
      router.push(`/locations/${encodeURIComponent(params.id)}?updated=1`);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Changes could not be saved. Check the form and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or the link may be incorrect."
        action={<Link className="link" href="/locations">Locations</Link>}
      />
    );
  }

  if (loadError || !location) {
    return <Banner kind="error">{loadError ?? 'Location could not be loaded. Try again.'}</Banner>;
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-2 text-sm text-ink-soft" aria-label="Breadcrumb">
        <Link className="link--muted" href="/locations">Locations</Link>
        <span aria-hidden="true">/</span>
        <span>Edit Location</span>
      </nav>
      <header className="card flex items-center gap-3 px-6 py-5">
        <button
          type="button"
          aria-label="Back to Location Details"
          className="text-brand"
          onClick={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-ink">Edit Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Update the saved details for this location.</p>
        </div>
      </header>
      <LocationForm
        initialValues={toFormValues(location)}
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
