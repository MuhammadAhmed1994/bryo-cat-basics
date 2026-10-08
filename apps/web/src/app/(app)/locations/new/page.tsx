'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, LocationIcon } from '@/components/icons';
import { ApiError, apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { LocationCompanyOption, LocationForm, LocationPayload } from '@/features/locations/location-form';

export default function NewLocationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<LocationCompanyOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => setCompanies(result.data))
      .catch((error) => {
        setCompaniesError(error instanceof ApiError ? error.message : 'Could not load Companies.');
      })
      .finally(() => setCompaniesLoading(false));
  }, []);

  async function save(values: LocationPayload) {
    await apiFetch('/locations', { method: 'POST', body: values });
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
            <h1 className="text-2xl font-semibold text-ink">Add Location</h1>
            <p className="mt-1 text-sm text-ink-soft">Create and associate a location in your workspace.</p>
          </div>
        </header>
      </div>

      <LocationForm
        mode="create"
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
