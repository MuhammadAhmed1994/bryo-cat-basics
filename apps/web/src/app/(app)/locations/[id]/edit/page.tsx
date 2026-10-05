'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Company } from '@/lib/types';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { LocationForm, LocationFormValues } from '@/features/locations/location-form';

interface LocationDto {
  id: string;
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
  status: 'ACTIVE' | 'INACTIVE';
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<Partial<LocationFormValues> | null>(null);
  const [initialCompany, setInitialCompany] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    setFormError(null);

    apiFetch<LocationDto>(`/locations/${params.id}`)
      .then(async (loc) => {
        setInitialValues({
          name: loc.name,
          companyId: loc.companyId,
          phone: loc.phone ?? '',
          contactName: loc.contactPersonName ?? '',
          contactPhone: loc.contactPersonPhone ?? '',
          addressLine1: loc.addressLine1 ?? '',
          addressLine2: loc.addressLine2 ?? '',
          country: loc.country ?? '',
          stateProvince: loc.stateProvince ?? '',
          city: loc.city ?? '',
          postalCode: loc.postalCode ?? '',
        });
        if (loc.companyId) {
          try {
            const company = await apiFetch<Company>(`/companies/${loc.companyId}`);
            setInitialCompany({ id: company.id, name: company.name, isActive: company.isActive });
          } catch {
            // If the company cannot be loaded, keep just the id.
            setInitialCompany(null);
          }
        } else {
          setInitialCompany(null);
        }
      })
      .catch((error) =>
        setFormError(error instanceof ApiError ? error.message : 'We could not load this location.'),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading && !initialValues) {
    return (
      <div className="card">
        <Spinner label="Loading location" />
      </div>
    );
  }

  if (!initialValues) {
    return <Banner kind="error">{formError ?? 'Location not found.'}</Banner>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back"
          className="text-brand"
          onClick={() => router.push(`/locations/${params.id}`)}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
      </header>

      <LocationForm
        submitLabel="Save Changes"
        initialValues={initialValues}
        initialCompany={initialCompany}
        loading={loading}
        formError={formError}
        onCancel={() => router.push(`/locations/${params.id}`)}
      />
    </div>
  );
}
