'use client';

import { useEffect, useState } from 'react';
import { Banner, Spinner } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

interface CompanySingleSelectProps {
  value: string | null;
  onChange: (companyId: string | null) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}

/** Loads every page so active Companies beyond the initial API page remain selectable. */
async function loadActiveCompanies(): Promise<Company[]> {
  const collected: Company[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (collected.length < total) {
    const result = await apiFetch<Paginated<Company>>(
      `/companies?status=ACTIVE&page=${page}&perPage=100`,
    );
    collected.push(...result.data.filter((company) => company.isActive));
    total = result.total;
    if (result.data.length === 0 || collected.length >= total) break;
    page += 1;
  }

  return collected;
}

/** Optional, keyboard-native single Company selector used by Location forms. */
export function CompanySingleSelect({
  value,
  onChange,
  id = 'companyId',
  label = 'Company (optional)',
  disabled = false,
}: CompanySingleSelectProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loadActiveCompanies()
      .then((result) => {
        if (active) setCompanies(result);
      })
      .catch(() => {
        if (active) setError('Active Companies could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {loading ? (
        <>
          <select id={id} value={value ?? ''} disabled aria-busy="true">
            <option value="">No Company</option>
          </select>
          <Spinner label="Loading active Companies" />
        </>
      ) : error ? (
        <>
          <select id={id} value={value ?? ''} disabled aria-invalid="true">
            <option value="">No Company</option>
          </select>
          <Banner kind="error">{error}</Banner>
        </>
      ) : (
        <>
          <select
            id={id}
            value={value ?? ''}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value || null)}
            aria-describedby={companies.length === 0 ? `${id}-empty` : undefined}
          >
            <option value="">No Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          {companies.length === 0 ? (
            <p id={`${id}-empty`} className="hint">
              No active Companies available.
            </p>
          ) : (
            <p className="hint">Company is optional. Choose one active Company or leave it blank.</p>
          )}
        </>
      )}
    </div>
  );
}
