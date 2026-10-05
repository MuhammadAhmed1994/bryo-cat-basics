'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { LocationForm, LocationFormValues } from '@/features/locations/location-form';
import { ChevronLeftIcon } from '@/components/icons';

type LocationPayload = {
  name: string;
  companyId: string | null;
  phone: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  postalCode: string | null;
};

function toPayload(values: LocationFormValues): LocationPayload {
  return {
    name: values.name.trim(),
    companyId: values.companyId ?? null,
    phone: values.phone.trim() || null,
    contactPersonName: values.contactName.trim() || null,
    contactPersonPhone: values.contactPhone.trim() || null,
    addressLine1: values.addressLine1.trim() || null,
    addressLine2: values.addressLine2.trim() || null,
    country: values.geo.country.trim() || null,
    stateProvince: values.geo.stateProvince.trim() || null,
    city: values.geo.city.trim() || null,
    postalCode: values.postalCode.trim() || null,
  };
}

export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/locations', { method: 'POST', body: toPayload(values) });
      router.push('/locations');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'We could not save this location.');
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
          onClick={() => router.push('/locations')}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>

      <LocationForm
        submitLabel="Save Location"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
