'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Company } from '@/lib/types';
import { LocationForm, LocationFormValues } from '@/features/locations/location-form';
import { CompanyOption } from '@/features/locations/company-select';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';

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
  const [initialValues, setInitialValues] = useState<LocationFormValues | null>(null);
  const [initialCompany, setInitialCompany] = useState<CompanyOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const loc = await apiFetch<LocationDto>(`/locations/${params.id}`);
        if (!mounted) return;
        setInitialValues({
          name: loc.name,
          companyId: loc.companyId,
          geo: {
            country: loc.country ?? '',
            stateProvince: loc.stateProvince ?? '',
            city: loc.city ?? '',
          },
        });
        if (loc.companyId) {
          try {
            const company = await apiFetch<Company>(`/companies/${loc.companyId}`);
            if (!mounted) return;
            setInitialCompany({ id: company.id, name: company.name, isActive: company.isActive });
          } catch (e) {
            // If fetching the company fails, keep the form usable without it.
            console.error(e);
          }
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'We could not load this location.');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading location" />
      </div>
    );
  }
  if (error || !initialValues) {
    return <Banner kind="error">{error ?? 'Location not found.'}</Banner>;
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
        initialValues={initialValues}
        initialCompanyOption={initialCompany}
        submitLabel="Save Changes"
      />
    </div>
  );
}
