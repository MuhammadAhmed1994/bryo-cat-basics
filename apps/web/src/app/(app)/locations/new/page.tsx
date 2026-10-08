'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { Banner, Spinner, Toast } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { Company } from '@/lib/types';
import {
  LocationForm,
  LocationFormValues,
} from '@/features/locations/location-form';
import { createLocation, getActiveCompanies } from '@/features/locations/locations-api';

const CREATION_NOTICE = 'Location created successfully.';

function toLocationInput(values: LocationFormValues) {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    status: 'ACTIVE' as const,
    companyId: optional(values.companyId),
    description: optional(values.description),
    phone: optional(values.phone),
    contactPersonName: optional(values.contactPersonName),
    contactPersonPhone: optional(values.contactPersonPhone),
    contactPersonEmail: optional(values.contactPersonEmail),
    addressLine1: optional(values.addressLine1),
    addressLine2: optional(values.addressLine2),
    country: optional(values.country),
    stateProvince: optional(values.stateProvince),
    city: optional(values.city),
    postalCode: optional(values.postalCode),
  };
}

export default function NewLocationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getActiveCompanies()
      .then((items) => {
        if (active) setCompanies(items);
      })
      .catch(() => {
        if (active) setCompaniesError(true);
      })
      .finally(() => {
        if (active) setCompaniesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(values: LocationFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await createLocation(toLocationInput(values));
      setSuccessMessage(CREATION_NOTICE);
      // Store a one-time notice for the list screen and route back to the list.
      window.sessionStorage.setItem('location-toast', CREATION_NOTICE);
      router.push('/locations');
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
      {successMessage && <Toast message={successMessage} />}
      <header className="card flex items-center gap-2 px-7 py-5">
        <Link href="/locations" aria-label="Back to Locations" className="text-brand">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>
      <p className="text-sm text-ink-soft">Create a location and add its contact and address details.</p>

      {companiesLoading ? (
        <Spinner label="Loading form options" />
      ) : (
        <>
          {companiesError && (
            <Banner kind="error">Active Companies could not be loaded. You can still create a Location without a Company.</Banner>
          )}
          <LocationForm
            companies={companies}
            submitLabel="Save Location"
            submitting={submitting}
            formError={formError}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/locations')}
          />
        </>
      )}
    </div>
  );
}
