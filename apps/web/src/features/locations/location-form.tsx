'use client';

import { FormEvent, useState } from 'react';
import { ApiError } from '@/lib/api';
import { Banner, Field, Toast } from '@/components/ui';

export interface LocationCompanyOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface LocationRecord {
  id: string;
  name: string;
  phone: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  companyId: string | null;
  company?: LocationCompanyOption | null;
}

export interface LocationFormValues {
  name: string;
  phone: string;
  country: string;
  stateProvince: string;
  city: string;
  companyId: string;
}

export interface LocationPayload {
  name: string;
  phone: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  companyId: string | null;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
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
    companyId: location.companyId ?? '',
  };
}

export function toLocationPayload(values: LocationFormValues): LocationPayload {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    phone: optional(values.phone),
    country: optional(values.country),
    stateProvince: optional(values.stateProvince),
    city: optional(values.city),
    companyId: values.companyId || null,
  };
}

interface LocationFormProps {
  mode: 'create' | 'edit';
  locationId?: string;
  initialValues?: LocationFormValues;
  currentCompany?: LocationCompanyOption | null;
  companies: LocationCompanyOption[];
  companiesLoading?: boolean;
  companiesError?: string | null;
  submitting?: boolean;
  onSubmit: (values: LocationPayload) => Promise<void> | void;
  onSaved?: () => void;
  onCancel: () => void;
}

const validatePhone = (value: string) => {
  const phone = value.trim();
  return phone && !/^\+?[0-9\s()-]{6,}$/.test(phone)
    ? 'Enter a valid phone number.'
    : null;
};

export function LocationForm({
  mode,
  locationId,
  initialValues = EMPTY_LOCATION_FORM,
  currentCompany,
  companies,
  companiesLoading = false,
  companiesError = null,
  submitting = false,
  onSubmit,
  onSaved,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSubmitting = submitting || saving || saved;
  const selectedCompanyIsInactive =
    Boolean(currentCompany && !currentCompany.isActive && currentCompany.id === values.companyId);
  const selectableCompanies = companies.filter((company) => company.isActive);
  const companyOptions = selectedCompanyIsInactive && currentCompany
    ? [currentCompany, ...selectableCompanies.filter((company) => company.id !== currentCompany.id)]
    : selectableCompanies;

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name';
    else if (values.name.trim().length > 100) {
      nextErrors.name = 'Name cannot exceed 100 characters.';
    }
    const phoneError = validatePhone(values.phone);
    if (phoneError) nextErrors.phone = phoneError;
    setErrors(nextErrors);
    setServerError(null);
    setSaved(false);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await onSubmit(toLocationPayload(values));
      setSaved(true);
      if (onSaved) window.setTimeout(onSaved, 700);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors((current) => ({
          ...current,
          name: `A Location named “${values.name.trim()}” already exists.`,
        }));
      } else {
        setServerError(
          error instanceof ApiError
            ? error.message
            : mode === 'create'
              ? 'Location could not be saved. Review the form and try again.'
              : 'Changes could not be saved. Try again.',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {serverError && <Banner kind="error">{serverError}</Banner>}
      {companiesError && <Banner kind="error">Company options could not be loaded. You can still save without a Company.</Banner>}
      {saved && <Toast message={mode === 'create' ? 'Location created.' : 'Changes saved.'} />}

      <section className="card overflow-hidden" aria-labelledby="location-details-heading">
        <div className="border-b border-line px-6 py-5">
          <h2 id="location-details-heading" className="text-lg font-semibold text-ink">
            Location details
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === 'edit' ? 'Update the saved information for this location.' : 'Add a location to your workspace.'}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Location name" htmlFor="location-name" required error={errors.name}>
                <input
                  id="location-name"
                  name="name"
                  value={values.name}
                  maxLength={100}
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={`location-name-hint location-name-count${errors.name ? ' location-name-error' : ''}`}
                  onChange={(event) => update('name', event.target.value)}
                />
              </Field>
              <p id="location-name-hint" className="hint">Name is required and must be 100 characters or fewer.</p>
              {errors.name && <span id="location-name-error" className="sr-only">{errors.name}</span>}
              <p id="location-name-count" className="mt-1 text-right text-xs text-ink-soft" aria-live="polite">
                {values.name.length}/100 characters
              </p>
            </div>

            <Field label="Phone number (optional)" htmlFor="location-phone" error={errors.phone}>
              <input
                id="location-phone"
                name="phone"
                type="tel"
                value={values.phone}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'location-phone-error' : 'location-phone-hint'}
                onChange={(event) => update('phone', event.target.value)}
              />
              <p id="location-phone-hint" className="hint">Optional; follows the existing Company phone format.</p>
              {errors.phone && <span id="location-phone-error" className="sr-only">{errors.phone}</span>}
            </Field>

            <Field
              label="Company (optional)"
              htmlFor="location-company"
              hint={companiesLoading ? 'Loading Companies…' : companies.length === 0 ? 'No Companies available.' : 'Company is optional.'}
            >
              <div className="flex gap-2">
                <select
                  id="location-company"
                  name="companyId"
                  value={values.companyId}
                  disabled={companiesLoading}
                  onChange={(event) => update('companyId', event.target.value)}
                >
                  <option value="">No Company</option>
                  {companyOptions.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}{!company.isActive ? ' (inactive — currently associated)' : ''}
                    </option>
                  ))}
                </select>
                {values.companyId && (
                  <button
                    type="button"
                    className="btn btn--ghost shrink-0"
                    aria-label="Clear selected Company"
                    onClick={() => update('companyId', '')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </Field>

            <Field label="City (optional)" htmlFor="location-city">
              <input
                id="location-city"
                name="city"
                value={values.city}
                onChange={(event) => update('city', event.target.value)}
              />
            </Field>
            <Field label="State / Province (optional)" htmlFor="location-state-province">
              <input
                id="location-state-province"
                name="stateProvince"
                value={values.stateProvince}
                onChange={(event) => update('stateProvince', event.target.value)}
              />
            </Field>
            <Field label="Country (optional)" htmlFor="location-country">
              <input
                id="location-country"
                name="country"
                value={values.country}
                onChange={(event) => update('country', event.target.value)}
              />
            </Field>
          </div>

          {mode === 'create' && (
            <div className="mt-6 flex items-center justify-between rounded-lg border border-line bg-canvas px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Status</p>
                <p className="mt-0.5 text-xs text-ink-soft">New locations are active by default.</p>
              </div>
              <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">Active</span>
            </div>
          )}
        </div>
        <footer className="flex flex-col gap-3 border-t border-line bg-canvas px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-ink-soft">
            {locationId ? `Location ID: ${locationId}` : 'Company is optional.'}
          </span>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Save Location' : 'Save Changes'}
            </button>
          </div>
        </footer>
      </section>
    </form>
  );
}
