'use client';

import { useEffect, useState } from 'react';
import { Banner, Field } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

interface CompanySingleSelectProps {
  value?: string | null;
  onChange: (companyId: string | null) => void;
  id?: string;
  disabled?: boolean;
}

/** Optional, keyboard-accessible single Company selector for Location forms. */
export function CompanySingleSelect({
  value = null,
  onChange,
  id = 'location-company',
  disabled = false,
}: CompanySingleSelectProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadActiveCompanies() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<Paginated<Company>>('/companies?status=ACTIVE');
        if (mounted) setCompanies(response.data.filter((company) => company.isActive));
      } catch {
        if (mounted) setError('We could not load active Companies.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadActiveCompanies();
    return () => {
      mounted = false;
    };
  }, []);

  const loadingMessage = 'Loading active Companies…';
  const empty = !loading && !error && companies.length === 0;
  const stateId = `${id}-state`;
  const describedBy = error ? `${stateId} ${id}-error` : stateId;

  return (
    <Field label="Company (optional)" htmlFor={id} hint="Company is optional.">
      <select
        id={id}
        value={value ?? ''}
        disabled={disabled || loading || empty || Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">No Company</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      <span id={stateId} className="sr-only" aria-live="polite">
        {loading ? loadingMessage : empty ? 'No active Companies available.' : ''}
      </span>
      {loading && <p className="hint" role="status">{loadingMessage}</p>}
      {empty && <p className="hint" role="status">No active Companies available.</p>}
      {error && (
        <div id={`${id}-error`}>
          <Banner kind="error">{error}</Banner>
        </div>
      )}
    </Field>
  );
}
