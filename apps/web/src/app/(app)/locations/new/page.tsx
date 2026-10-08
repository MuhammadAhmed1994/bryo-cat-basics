'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui';
import { ApiError } from '@/lib/api';
import type { Company } from '@/lib/types';
import {
  LocationForm,
  type LocationFormValues,
} from '@/features/locations/location-form';
import {
  createLocation,
  listActiveCompanies,
  type CreateLocationInput,
} from '@/features/locations/locations-api';
import { ChevronLeftIcon } from '@/components/icons';

const CREATED_MESSAGE = 'Location created successfully.';

function toLocationInput(values: LocationFormValues): CreateLocationInput {
  return {
    name: values.name,
    status: 'ACTIVE',
    description: values.description || null,
    companyId: values.companyId || null,
    phone: values.phone || null,
    contactPersonName: values.contactPersonName || null,
    contactPersonPhone: values.contactPersonPhone || null,
    contactPersonEmail: values.contactPersonEmail || null,
    addressLine1: values.addressLine1 || null,
    addressLine2: values.addressLine2 || null,
    country: values.country || null,
    stateProvince: values.stateProvince || null,
    city: values.city || null,
    postalCode: values.postalCode || null,
  };
}

/** Create an Active Location using the shared Location form. */
export default function NewLocationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    let current = true;
    listActiveCompanies()
      .then((result) => {
        if (current) setCompanies(result.data.filter((company) => company.isActive));
      })
      .catch(() => {
        // Company association is optional, so the form remains usable if options fail.
      });
    return () => {
      current = false;
    };
  }, []);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createLocation(toLocationInput(values));
      setCreated(true);
      // Keep the confirmation visible briefly before transitioning to the list.
      window.setTimeout(() => router.push('/locations'), 1200);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Location could not be saved. Check the form and try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back to Locations"
          className="text-brand"
          onClick={() => router.push('/locations')}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>

      <LocationForm
        companies={companies}
        submitLabel="Save Location"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
      {created && <Toast message={CREATED_MESSAGE} />}
    </div>
  );
}
