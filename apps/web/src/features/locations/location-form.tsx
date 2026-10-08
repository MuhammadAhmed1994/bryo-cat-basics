'use client';

import { useState } from 'react';
import { Banner, Field } from '@/components/ui';
import { validateCompanyPhone } from '@/lib/validation';

export interface LocationCompanyOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface LocationFormValues {
  name: string;
  phone: string;
  country: string;
  stateProvince: string;
  city: string;
  companyId: string;
}

export interface SavedLocation extends LocationFormValues {
  id: string;
  company: LocationCompanyOption | null;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
  name: '',
  phone: '',
  country: '',
  stateProvince: '',
  city: '',
  companyId: '',
};

export function locationToForm(location: SavedLocation): LocationFormValues {
  return {
    name: location.name ?? '',
    phone: location.phone ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    companyId: location.companyId ?? location.company?.id ?? '',
  };
}

export function toLocationPayload(values: LocationFormValues) {
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
  initialValues?: LocationFormValues;
  companies?: LocationCompanyOption[];
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  successMessage?: string | null;
  companiesLoading?: boolean;
  companiesError?: string | null;
  onSubmit: (values: LocationFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  companies = [],
  submitLabel,
  submitting = false,
  formError = null,
  successMessage = null,
  companiesLoading = false,
  companiesError = null,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>({ ...initialValues });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const duplicateError = Boolean(formError && /already exists|duplicate|conflict/i.test(formError));

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string | null> = {
      name: values.name.trim() ? null : 'Enter a location name.',
      phone: values.phone.trim() ? validateCompanyPhone(values.phone) : null,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    void onSubmit(values);
  }

  const activeCompanies = companies.filter((company) => company.isActive);
  const savedInactiveCompany = values.companyId
    ? companies.find((company) => company.id === values.companyId && !company.isActive)
    : undefined;
  const companyNameError = duplicateError
    ? 'A Location with this name already exists. Choose a different name.'
    : errors.name;
  const phoneError = errors.phone ?? (formError && /phone/i.test(formError) ? formError : null);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}
      {successMessage && <Banner kind="success">{successMessage}</Banner>}

      <section className="card overflow-hidden" aria-labelledby="location-details-heading">
        <div className="border-b border-line px-6 py-5">
          <h2 id="location-details-heading" className="text-lg font-semibold text-ink">
            Location details
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Enter the information for this location.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Location name" htmlFor="location-name" required>
                <input
                  id="location-name"
                  name="name"
                  value={values.name}
                  maxLength={100}
                  required
                  aria-invalid={Boolean(companyNameError)}
                  aria-describedby={companyNameError ? 'location-name-hint location-name-error' : 'location-name-hint'}
                  onChange={(event) => update('name', event.target.value)}
                />
                <p id="location-name-hint" className="hint">
                  {values.name.length}/100 characters. Name is required and must be 100 characters or fewer.
                </p>
                {companyNameError && <p id="location-name-error" className="error" role="alert">{companyNameError}</p>}
              </Field>
            </div>
            <Field label="Phone number" htmlFor="location-phone">
              <input
                id="location-phone"
                name="phone"
                type="tel"
                value={values.phone}
                maxLength={30}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'location-phone-hint location-phone-error' : 'location-phone-hint'}
                onChange={(event) => update('phone', event.target.value)}
              />
              <p id="location-phone-hint" className="hint">Optional; follows the existing Company phone format.</p>
              {phoneError && <p id="location-phone-error" className="error" role="alert">{phoneError}</p>}
            </Field>
            <Field
              label="Company (optional)"
              htmlFor="location-company"
              hint="Company is optional. Clear the selection to remove the association."
            >
              <select
                id="location-company"
                name="companyId"
                value={values.companyId}
                disabled={companiesLoading && activeCompanies.length === 0 && !savedInactiveCompany}
                onChange={(event) => update('companyId', event.target.value)}
              >
                <option value="">No company</option>
                {savedInactiveCompany && (
                  <option value={savedInactiveCompany.id}>
                    {savedInactiveCompany.name} (Inactive — currently associated)
                  </option>
                )}
                {activeCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              {values.companyId && (
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  aria-label="Clear selected company"
                  onClick={() => update('companyId', '')}
                >
                  Clear selected Company
                </button>
              )}
              {companiesLoading && <p className="hint" role="status">Loading Companies…</p>}
              {!companiesLoading && !activeCompanies.length && !savedInactiveCompany && (
                <p className="hint">No Companies available. You can save this Location without a Company.</p>
              )}
              {companiesError && <p className="hint">Company options could not be loaded. You can still save without an association.</p>}
            </Field>
            <Field label="City (optional)" htmlFor="location-city">
              <input
                id="location-city"
                name="city"
                value={values.city}
                maxLength={100}
                onChange={(event) => update('city', event.target.value)}
              />
            </Field>
            <Field label="State / Province (optional)" htmlFor="location-state-province">
              <input
                id="location-state-province"
                name="stateProvince"
                value={values.stateProvince}
                maxLength={100}
                onChange={(event) => update('stateProvince', event.target.value)}
              />
            </Field>
            <Field label="Country (optional)" htmlFor="location-country">
              <input
                id="location-country"
                name="country"
                value={values.country}
                maxLength={100}
                onChange={(event) => update('country', event.target.value)}
              />
            </Field>
          </div>
          {submitLabel === 'Save Location' && (
            <div className="mt-6 flex items-center justify-between rounded-md border border-line bg-canvas px-4 py-3">
              <div>
                <p className="m-0 text-sm font-medium text-ink">Status</p>
                <p className="m-0 mt-1 text-xs text-ink-soft">New locations are active by default.</p>
              </div>
              <span className="rounded-full border border-brand-light bg-brand-light px-3 py-1 text-xs font-medium text-brand">Active</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-line bg-canvas/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-xs text-ink-soft" aria-live="polite">
            {submitting ? 'Saving Location…' : successMessage ? 'Changes saved successfully.' : 'Company association is optional.'}
          </p>
          <div className="flex gap-3 sm:justify-end">
            <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
