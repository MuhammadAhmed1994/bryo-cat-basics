'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, Field, Spinner, Toast } from '@/components/ui';
import { validateCompanyPhone } from '@/lib/validation';

export interface LocationValues {
  name: string;
  phone: string;
  country: string;
  stateProvince: string;
  city: string;
  companyId: string;
}

export interface LocationRecord extends LocationValues {
  id: string;
  company?: { id: string; name: string; isActive?: boolean } | null;
}

export const EMPTY_LOCATION_VALUES: LocationValues = {
  name: '', phone: '', country: '', stateProvince: '', city: '', companyId: '',
};

export function locationToForm(location: LocationRecord): LocationValues {
  return {
    name: location.name ?? '',
    phone: location.phone ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    companyId: location.companyId ?? location.company?.id ?? '',
  };
}

export function toLocationPayload(values: LocationValues) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim() || null,
    country: values.country.trim() || null,
    stateProvince: values.stateProvince.trim() || null,
    city: values.city.trim() || null,
    companyId: values.companyId || null,
  };
}

interface LocationFormProps {
  mode: 'create' | 'edit';
  locationId?: string;
  initialValues?: LocationValues;
  currentCompany?: LocationRecord['company'];
}

export function LocationForm({ mode, locationId, initialValues = EMPTY_LOCATION_VALUES, currentCompany }: LocationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LocationValues>(initialValues);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => setCompanies(result.data))
      .catch(() => setCompaniesError('Companies could not be loaded. You can still save without an association.'))
      .finally(() => setCompaniesLoading(false));
  }, []);

  const availableCompanies = currentCompany && !companies.some((company) => company.id === currentCompany.id)
    ? [...companies, { id: currentCompany.id, name: currentCompany.name } as Company]
    : companies;

  function update(key: keyof LocationValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    else if (values.name.trim().length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    if (values.phone.trim()) {
      const phoneError = validateCompanyPhone(values.phone);
      if (phoneError) nextErrors.phone = phoneError;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await apiFetch<LocationRecord>(mode === 'create' ? '/locations' : `/locations/${locationId}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        body: toLocationPayload(values),
      });
      setSuccess(mode === 'create' ? 'Location created.' : 'Changes saved.');
      window.setTimeout(() => router.push('/locations'), 900);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors((current) => ({ ...current, name: 'A location with this name already exists.' }));
        setFormError('This name is already used by another Location. Choose a different name.');
      } else {
        setFormError(error instanceof ApiError ? error.message : 'Location could not be saved. Review the form and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const editing = mode === 'edit';
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Link href="/locations" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-soft hover:text-brand">
        <span aria-hidden="true">‹</span> Back to Locations
      </Link>
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-emerald-100 bg-emerald-50 text-brand"><span aria-hidden="true">⌖</span></span>
        <div>
          <h1 className="text-2xl font-semibold text-ink">{editing ? 'Edit Location' : 'Add Location'}</h1>
          <p className="mt-1 text-sm text-ink-soft">{editing ? 'Your saved details are shown below.' : 'Create and associate a location in your workspace.'}</p>
        </div>
      </header>

      {success && <Toast message={success} />}
      <form className="card overflow-hidden" onSubmit={handleSubmit} noValidate>
        <div className="border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold text-ink">Location details</h2>
          <p className="mt-1 text-sm text-ink-soft">{editing ? 'Update the saved information for this location.' : 'Enter the details for this location.'}</p>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-6 py-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Location name" htmlFor="location-name" required error={errors.name} hint="Name is required and must be 100 characters or fewer.">
              <input id="location-name" value={values.name} maxLength={100} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'location-name-error' : undefined} onChange={(event) => update('name', event.target.value)} />
              {errors.name && <span id="location-name-error" className="sr-only">{errors.name}</span>}
            </Field>
            <p className="mt-1 text-right text-xs text-ink-soft" aria-live="polite">{values.name.length}/100</p>
          </div>
          <Field label="Phone number" htmlFor="location-phone" error={errors.phone} hint="Optional; follows the existing Company phone format.">
            <input id="location-phone" type="tel" value={values.phone} maxLength={30} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'location-phone-error' : undefined} onChange={(event) => update('phone', event.target.value)} />
            {errors.phone && <span id="location-phone-error" className="sr-only">{errors.phone}</span>}
          </Field>
          <div>
            <Field label="Company (optional)" htmlFor="location-company" hint={editing ? 'Company is optional; clear the selection to remove the association.' : 'Company is optional.'}>
              <select id="location-company" value={values.companyId} disabled={companiesLoading && !currentCompany} onChange={(event) => update('companyId', event.target.value)}>
                <option value="">No Company</option>
                {availableCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}{company.isActive === false || (company.id === currentCompany?.id && currentCompany?.isActive === false) ? ' (Inactive — currently associated)' : ''}</option>)}
              </select>
            </Field>
            {companiesLoading && <p className="mt-1 text-xs text-ink-soft" role="status">Loading Companies…</p>}
            {!companiesLoading && !companiesError && companies.length === 0 && !currentCompany && <p className="mt-1 text-xs text-ink-soft">No Companies available.</p>}
            {companiesError && <p className="mt-1 text-xs text-ink-soft">{companiesError}</p>}
          </div>
          <Field label="City" htmlFor="location-city"><input id="location-city" value={values.city} onChange={(event) => update('city', event.target.value)} /></Field>
          <Field label="State / Province" htmlFor="location-state"><input id="location-state" value={values.stateProvince} onChange={(event) => update('stateProvince', event.target.value)} /></Field>
          <Field label="Country" htmlFor="location-country"><input id="location-country" value={values.country} onChange={(event) => update('country', event.target.value)} /></Field>
          {!editing && <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-4 py-3 md:col-span-2"><div><p className="text-sm font-medium">Status</p><p className="text-xs text-ink-soft">New locations are active by default.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-brand">Active</span></div>}
        </div>
        {formError && <div className="px-6 pb-4"><Banner kind="error">{formError}</Banner></div>}
        {success && <div className="px-6 pb-4"><Banner kind="success">{success}</Banner></div>}
        <footer className="flex flex-col-reverse justify-between gap-3 border-t border-line bg-gray-50 px-6 py-4 sm:flex-row sm:items-center">
          <span className="text-xs text-ink-soft">{editing ? `Location ID: ${locationId}` : 'Fields marked required must be completed.'}</span>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn--ghost" onClick={() => router.push('/locations')}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Save Changes' : 'Save Location'}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}

export function LocationLoading() {
  return <section className="card"><Spinner label="Loading Location" /></section>;
}
