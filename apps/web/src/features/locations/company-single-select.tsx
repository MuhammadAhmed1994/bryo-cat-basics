'use client';

import { useEffect, useState } from 'react';
import { Banner, Field, Spinner } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

interface CompanySingleSelectProps {
  value: string | null;
  onChange: (companyId: string | null) => void;
  id?: string;
  label?: string;
  error?: string | null;
}

/** Optional, accessible single-company association selector for Location forms. */
export function CompanySingleSelect({
  value,
  onChange,
  id = 'location-company',
  label = 'Company',
  error,
}: CompanySingleSelectProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    apiFetch<Paginated<Company>>('/companies?status=ACTIVE')
      .then((result) => {
        if (cancelled) return;
        // Keep the control active-only even if an API proxy returns mixed results.
        setCompanies(result.data.filter((company) => company.isActive));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load active Companies. Try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <Field
      label={`${label} (optional)`}
      htmlFor={id}
      hint="Company is optional."
      error={error}
    >
      <select
        id={id}
        value={value ?? ''}
        disabled={loading || Boolean(loadError)}
        aria-busy={loading}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">No Company</option>
        {companies.map((company) => (
          <option value={company.id} key={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      {loading && <Spinner label="Loading active Companies" />}
      {!loading && !loadError && companies.length === 0 && (
        <p className="hint" role="status">No active Companies available.</p>
      )}
      {loadError && (
        <div className="mt-2">
          <Banner kind="error">{loadError}</Banner>
          <button
            type="button"
            className="btn btn--ghost mt-2"
            onClick={() => setReload((attempt) => attempt + 1)}
          >
            Retry loading Companies
          </button>
        </div>
      )}
    </Field>
  );
}
