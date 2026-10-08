'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { ChevronLeftIcon, LocationIcon } from '@/components/icons';
import {
  LocationCompanyOption,
  LocationForm,
  LocationPayload,
  LocationRecord,
  locationToForm,
} from '@/features/locations/location-form';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationRecord | null>(null);
  const [companies, setCompanies] = useState<LocationCompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<LocationRecord>(`/locations/${params.id}`)
      .then(setLocation)
      .catch((error) => {
        setLoadError(error instanceof ApiError ? error.message : 'Location could not be loaded.');
      })
      .finally(() => setLoading(false));

    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => setCompanies(result.data))
      .catch((error) => {
        setCompaniesError(error instanceof ApiError ? error.message : 'Could not load Companies.');
      })
      .finally(() => setCompaniesLoading(false));
  }, [params.id]);

  async function save(values: LocationPayload) {
    await apiFetch(`/locations/${params.id}`, { method: 'PATCH', body: values });
  }

  if (loading) {
    return <section className="card"><Spinner label="Loading Location" /></section>;
  }

  if (!location) {
    if (loadError?.toLowerCase().includes('not found')) {
      return (
        <EmptyState
          title="Location not found"
          message="This Location may have been removed or is no longer available."
          action={<Link className="btn btn--secondary" href="/locations">Back to Locations</Link>}
        />
      );
    }
    return <Banner kind="error">{loadError ?? 'Location not found.'}</Banner>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <Link href="/locations" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-ink-soft hover:text-brand">
          <ChevronLeftIcon /> Back to Locations
        </Link>
        <header className="card flex items-center gap-3 px-6 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-brand-light bg-brand-light text-brand"><LocationIcon /></span>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Edit Location</h1>
            <p className="mt-1 text-sm text-ink-soft">Your saved details are shown below.</p>
          </div>
        </header>
      </div>
      <LocationForm
        mode="edit"
        locationId={location.id}
        initialValues={locationToForm(location)}
        currentCompany={location.company ?? null}
        companies={companies}
        companiesLoading={companiesLoading}
        companiesError={companiesError}
        onSubmit={save}
        onSaved={() => router.push('/locations')}
        onCancel={() => router.push('/locations')}
      />
    </div>
  );
}
