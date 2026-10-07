'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Company, Paginated } from '@/lib/types';
import { Banner, Spinner } from '@/components/ui';
import { getLocation } from '@/features/locations/location-api';
import type { Location } from '@/features/locations/location-types';
import { LocationForm } from '@/features/locations/location-form';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getLocation(params.id),
      apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100').catch(() => ({ data: [], total: 0, page: 1, perPage: 100 })),
    ])
      .then(([record, companyPage]) => {
        if (active) {
          setLocation(record);
          setCompanies(companyPage.data);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : '');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  if (loading) return <div className="card"><Spinner label="Loading location" /></div>;
  if (!location) return <Banner kind="error">{error || 'Location information is unavailable.'}</Banner>;
  return <LocationForm mode="edit" locationId={params.id} initialLocation={location} companies={companies} />;
}
