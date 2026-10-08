'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/icons';
import { ApiError } from '@/lib/api';
import { createLocation } from '@/features/locations/location-api';
import { LocationForm, LocationFormValues } from '@/features/locations/location-form';

export default function NewLocationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createLocation({
        name: values.name.trim(),
        companyId: values.companyId || null,
        phone: values.phone.trim() || null,
        contactPerson: values.contactPerson.trim() || null,
        contactPersonPhone: values.contactPersonPhone.trim() || null,
        addressLine1: values.addressLine1.trim() || null,
        addressLine2: values.addressLine2.trim() || null,
        country: values.country.trim() || null,
        stateProvince: values.stateProvince.trim() || null,
        city: values.city.trim() || null,
        postalCode: values.postalCode.trim() || null,
      });
      router.push('/locations?success=Location%20added%20successfully');
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Location could not be created. Review the highlighted fields and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-6 py-5">
        <button
          type="button"
          aria-label="Back to Locations"
          className="text-brand"
          onClick={() => router.push('/locations')}
        >
          <ChevronLeftIcon />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-ink">Add Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Add a new location and its identifying details.</p>
        </div>
      </header>
      <LocationForm
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
