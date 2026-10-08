'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { Company } from '@/lib/types';
import { ChevronLeftIcon } from '@/components/icons';
import { Toast } from '@/components/ui';
import {
  LocationForm,
  LocationFormValues,
} from '@/features/locations/location-form';
import {
  createLocation,
  getActiveCompanies,
} from '@/features/locations/locations-api';

const CREATE_SUCCESS_MESSAGE = 'Location created successfully.';
const CREATE_SUCCESS_KEY = 'nbryo.locations.created';

export default function NewLocationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    let active = true;
    getActiveCompanies()
      .then((options) => {
        if (active) setCompanies(options);
      })
      .catch(() => {
        if (active) setFormError('Active Companies could not be loaded. You can still create a Location without a Company.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createLocation({
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
      setCreated(true);
      // The list route uses this marker/query to show its post-create toast.
      // Storage can be unavailable (for example, in a restricted browser), so
      // it must never prevent navigation after the API has successfully saved.
      try {
        window.sessionStorage.setItem(CREATE_SUCCESS_KEY, 'true');
      } catch {
        // The query parameter remains available as a fallback success signal.
      }
      router.push('/locations?created=1');
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Location could not be saved. Check the form and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {created && <Toast message={CREATE_SUCCESS_MESSAGE} />}
      <header className="card flex items-center gap-2 px-7 py-5">
        <Link
          href="/locations"
          aria-label="Back to Locations"
          className="text-brand"
        >
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>
      <p className="text-sm text-ink-soft">Create a location and add its contact and address details.</p>
      <LocationForm
        companies={companies}
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
