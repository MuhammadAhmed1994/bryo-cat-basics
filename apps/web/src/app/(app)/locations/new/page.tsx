'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Company, Paginated } from '@/lib/types';
import { LocationForm } from '@/features/locations/location-form';

export default function NewLocationPage() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => { if (active) setCompanies(result.data); })
      .catch(() => { if (active) setCompanies([]); });
    return () => { active = false; };
  }, []);

  return <LocationForm mode="create" companies={companies} />;
}
