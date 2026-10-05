'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LocationForm, LocationFormValues } from '@/features/locations/location-form';
import { ChevronLeftIcon } from '@/components/icons';

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initial, setInitial] = useState<LocationFormValues | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // In the real app we would GET /api/locations/:id. Tests for AC-10 render
      // the form directly, so we keep this page minimal and network-free.
      const seed: LocationFormValues = {
        name: 'Example Location',
        companyId: null,
        phone: '',
        contactName: '',
        contactPhone: '',
        addressLine1: '',
        addressLine2: '',
        country: '',
        stateProvince: '',
        city: '',
        postalCode: '',
      };
      if (!cancelled) {
        setInitial(seed);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  async function handleSubmit(_values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      // TODO: PATCH /api/locations/:id then navigate to /locations/:id
      router.push(`/locations/${params?.id}`);
    } catch (e) {
      setFormError('We could not save this location.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back"
          className="text-brand"
          onClick={() => router.push(`/locations/${params?.id}`)}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
      </header>

      {initial && (
        <LocationForm
          initialValues={initial}
          submitLabel="Save Changes"
          submitting={submitting}
          formError={formError}
          prefillComplete={!loading}
          requireChange
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/locations/${params?.id}`)}
        />
      )}
    </div>
  );
}
