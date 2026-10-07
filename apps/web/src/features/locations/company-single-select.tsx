'use client';

import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner } from '@/components/ui';

interface CompanySingleSelectProps {
  value: string | null;
  onChange: (companyId: string | null) => void;
  id?: string;
  disabled?: boolean;
}

/** Optional, keyboard-accessible association to one active Company. */
export function CompanySingleSelect({
  value,
  onChange,
  id = 'companyId',
  disabled = false,
}: CompanySingleSelectProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);

    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => {
        if (current) setCompanies(result.data.filter((company) => company.isActive));
      })
      .catch((reason: unknown) => {
        if (!current) return;
        setCompanies([]);
        setError(
          reason instanceof ApiError ? reason.message : 'Active Companies could not be loaded.',
        );
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [reload]);

  const selectedCompany = companies.find((company) => company.id === value);

  return (
    <div className="field">
      <label htmlFor={id}>Company <span className="text-ink-muted">(optional)</span></label>
      {loading ? (
        <>
          <select id={id} value="" disabled aria-describedby={`${id}-status`}>
            <option value="">Loading active Companies…</option>
          </select>
          <p id={`${id}-status`} className="hint" role="status" aria-live="polite">
            Loading active Companies…
          </p>
        </>
      ) : error ? (
        <div>
          <select id={id} value="" disabled aria-describedby={`${id}-error`}>
            <option value="">Companies unavailable</option>
          </select>
          <div id={`${id}-error`} className="mt-2">
            <Banner kind="error">{error}</Banner>
          </div>
          <button
            type="button"
            className="mt-2 text-sm text-brand underline"
            onClick={() => setReload((attempt) => attempt + 1)}
          >
            Retry loading Companies
          </button>
        </div>
      ) : companies.length === 0 ? (
        <>
          <select
            id={id}
            value=""
            disabled={disabled}
            onChange={() => onChange(null)}
          >
            <option value="">No Company</option>
          </select>
          <p className="hint">No active Companies available.</p>
        </>
      ) : (
        <>
          <select
            id={id}
            value={value ?? ''}
            disabled={disabled}
            aria-describedby={`${id}-help`}
            onChange={(event) => onChange(event.target.value || null)}
          >
            <option value="">No Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <p id={`${id}-help`} className="hint">
            {selectedCompany ? `Selected: ${selectedCompany.name}.` : 'Company is optional.'}
            {value && !selectedCompany ? ' The selected Company is not available.' : ''}
          </p>
        </>
      )}
    </div>
  );
}
