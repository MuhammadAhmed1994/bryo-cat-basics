'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Banner, Field } from '@/components/ui';

export interface LocationRecord {
  id: string;
  name: string;
  phone: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  companyId: string | null;
  company?: { id: string; name: string; isActive?: boolean } | null;
}

export interface LocationFormValues {
  name: string;
  phone: string;
  country: string;
  stateProvince: string;
  city: string;
  companyId: string;
}

const EMPTY_VALUES: LocationFormValues = {
  name: '',
  phone: '',
  country: '',
  stateProvince: '',
  city: '',
  companyId: '',
};

export function locationToForm(location: LocationRecord): LocationFormValues {
  return {
    name: location.name ?? '',
    phone: location.phone ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    companyId: location.companyId ?? location.company?.id ?? '',
  };
}

interface LocationFormProps {
  locationId?: string;
  initialLocation?: LocationRecord;
  submitLabel: string;
}

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,}$/;

export function LocationForm({ locationId, initialLocation, submitLabel }: LocationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LocationFormValues>(
    initialLocation ? locationToForm(initialLocation) : EMPTY_VALUES,
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof LocationFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => {
        if (active) setCompanies(result.data);
      })
      .catch(() => {
        if (active) setCompaniesError('Companies could not be loaded. You can still save without a Company.');
      })
      .finally(() => {
        if (active) setCompaniesLoading(false);
      });
    return () => { active = false; };
  }, []);

  function update(key: keyof LocationFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof LocationFormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    else if (values.name.trim().length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    setErrors(nextErrors);
    setFormError(null);
    setSuccess(null);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      country: values.country.trim() || null,
      stateProvince: values.stateProvince.trim() || null,
      city: values.city.trim() || null,
      companyId: values.companyId || null,
    };

    try {
      await apiFetch<LocationRecord>(locationId ? `/locations/${locationId}` : '/locations', {
        method: locationId ? 'PATCH' : 'POST',
        body: payload,
      });
      setSuccess(locationId ? 'Changes saved.' : 'Location created.');
      window.setTimeout(() => router.push('/locations'), 900);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError(`Duplicate Location name: “${values.name.trim()}” is already in use.`);
      } else if (error instanceof ApiError) {
        setFormError(error.message || 'Location could not be saved. Review the form and try again.');
      } else {
        setFormError('Location could not be saved. Review the form and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const currentCompany = initialLocation?.company;
  const selectorCompanies = [...companies];
  if (currentCompany && !selectorCompanies.some((company) => company.id === currentCompany.id)) {
    // Retain a saved inactive Company in the current selection, without offering it as a new choice.
    selectorCompanies.unshift({
      id: currentCompany.id,
      name: `${currentCompany.name}${currentCompany.isActive === false ? ' (Inactive — current selection)' : ''}`,
      isActive: currentCompany.isActive !== false,
    } as Company);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate aria-label="Location details">
      {formError && <Banner kind="error">{formError}</Banner>}
      {success && <Banner kind="success">{success}</Banner>}

      <section className="card px-6 py-5" aria-labelledby="location-details-heading">
        <div className="mb-5 border-b border-line pb-4">
          <h2 id="location-details-heading" className="text-lg font-semibold text-ink">Location details</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {locationId ? 'Your saved details are shown below.' : 'Create and associate a location in your workspace.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Location name" htmlFor="location-name" required error={errors.name} hint="Name is required and must be 100 characters or fewer.">
              <input
                id="location-name"
                name="name"
                value={values.name}
                maxLength={100}
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby="location-name-hint"
                onChange={(event) => update('name', event.target.value)}
              />
            </Field>
            <span id="location-name-hint" className="sr-only">Name is required and must be 100 characters or fewer.</span>
            <p className="mt-1 text-right text-xs text-ink-soft" aria-live="polite">{values.name.length}/100 characters</p>
          </div>

          <Field label="Phone number" htmlFor="location-phone" error={errors.phone} hint="Optional; follows the existing Company phone format.">
            <input
              id="location-phone"
              name="phone"
              type="tel"
              value={values.phone}
              placeholder="+1 555 0100"
              aria-invalid={Boolean(errors.phone)}
              onChange={(event) => update('phone', event.target.value)}
            />
          </Field>

          <Field label="Company (optional)" htmlFor="location-company" hint="Company is optional; clear the selection to remove the association.">
            <select
              id="location-company"
              name="companyId"
              value={values.companyId}
              disabled={companiesLoading}
              onChange={(event) => update('companyId', event.target.value)}
              aria-label="Company (optional)"
            >
              <option value="">No Company</option>
              {selectorCompanies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            {companiesLoading && <span className="mt-1 block text-xs text-ink-soft" role="status">Loading Companies…</span>}
            {!companiesLoading && !selectorCompanies.length && <span className="mt-1 block text-xs text-ink-soft">No Companies available.</span>}
            {companiesError && <span className="mt-1 block text-xs text-ink-soft">{companiesError}</span>}
          </Field>

          <Field label="City" htmlFor="location-city">
            <input id="location-city" name="city" value={values.city} onChange={(event) => update('city', event.target.value)} />
          </Field>
          <Field label="State / Province" htmlFor="location-state">
            <input id="location-state" name="stateProvince" value={values.stateProvince} onChange={(event) => update('stateProvince', event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Country" htmlFor="location-country">
              <input id="location-country" name="country" value={values.country} onChange={(event) => update('country', event.target.value)} />
            </Field>
          </div>
        </div>
        {!locationId && (
          <div className="mt-5 flex items-center justify-between rounded-md border border-line bg-canvas px-4 py-3 text-sm">
            <span className="font-medium">Status</span>
            <span>Active by default</span>
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button type="button" className="btn btn--ghost" onClick={() => router.push('/locations')}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
      {submitting && <p role="status" aria-live="polite" className="text-right text-sm text-ink-soft">Saving Location…</p>}
    </form>
  );
}
