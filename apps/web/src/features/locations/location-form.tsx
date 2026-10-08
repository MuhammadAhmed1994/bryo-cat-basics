'use client';

import { FormEvent, useState } from 'react';
import { Field } from '@/components/ui';
import { Company } from '@/lib/types';
import { DependentLocationSelect } from './dependent-location-select';

export interface LocationFormValues {
  name: string;
  companyId: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  stateProvince: string;
  city: string;
  postalCode: string;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
  name: '',
  companyId: '',
  contactPersonName: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  stateProvince: '',
  city: '',
  postalCode: '',
};

export interface LocationFormProps {
  initialValues?: Partial<LocationFormValues>;
  companies?: Company[];
  submitLabel?: string;
  submitting?: boolean;
  formError?: string | null;
  onSubmit: (values: LocationFormValues) => void;
  onCancel?: () => void;
}

export function LocationForm({
  initialValues,
  companies = [],
  submitLabel = 'Save Location',
  submitting = false,
  formError,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(() => ({
    ...EMPTY_LOCATION_FORM,
    ...initialValues,
  }));
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = values.name.trim();
    const nextNameError = !trimmedName
      ? 'Location name is required.'
      : trimmedName.length > 100
        ? 'Location name must be 100 characters or fewer.'
        : null;
    const nextEmailError = values.contactPersonEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactPersonEmail.trim())
      ? 'Enter a valid email address.'
      : null;
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    if (nextNameError || nextEmailError) return;
    onSubmit({ ...values, name: trimmedName });
  }

  const activeCompanies = companies.filter((company) => company.isActive);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate aria-label="Location form">
      {formError && <div className="banner banner--error" role="alert">{formError}</div>}

      <section className="card px-7 py-6" aria-labelledby="location-details-heading">
        <h2 id="location-details-heading" className="mb-4 text-base font-semibold text-ink">Location details</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label="Location name"
              htmlFor="location-name"
              error={nameError}
              hint="Name is required and must be 100 characters or fewer."
              required
            >
              <input
                id="location-name"
                name="name"
                value={values.name}
                maxLength={100}
                aria-invalid={Boolean(nameError)}
                onChange={(event) => update('name', event.target.value)}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Company" htmlFor="location-company" hint="Company is optional.">
              <select
                id="location-company"
                value={values.companyId}
                onChange={(event) => update('companyId', event.target.value)}
              >
                <option value="">No Company</option>
                {activeCompanies.map((company) => (
                  <option value={company.id} key={company.id}>{company.name}</option>
                ))}
              </select>
            </Field>
            {activeCompanies.length === 0 && <p className="hint">No active Companies available.</p>}
          </div>

          <Field label="Contact name" htmlFor="contact-person-name">
            <input id="contact-person-name" value={values.contactPersonName} onChange={(event) => update('contactPersonName', event.target.value)} />
          </Field>
          <Field label="Contact email" htmlFor="contact-person-email" error={emailError}>
            <input
              id="contact-person-email"
              type="email"
              value={values.contactPersonEmail}
              aria-invalid={Boolean(emailError)}
              onChange={(event) => update('contactPersonEmail', event.target.value)}
            />
          </Field>
          <Field label="Contact phone" htmlFor="contact-person-phone">
            <input id="contact-person-phone" type="tel" value={values.contactPersonPhone} onChange={(event) => update('contactPersonPhone', event.target.value)} />
          </Field>
          <Field label="Location phone" htmlFor="location-phone">
            <input id="location-phone" type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6" aria-labelledby="location-address-heading">
        <h2 id="location-address-heading" className="mb-4 text-base font-semibold text-ink">Address</h2>
        <DependentLocationSelect
          idPrefix="location"
          country={values.country}
          stateProvince={values.stateProvince}
          city={values.city}
          onCountryChange={(country) => update('country', country)}
          onStateProvinceChange={(stateProvince) => update('stateProvince', stateProvince)}
          onCityChange={(city) => update('city', city)}
          countries={['Australia', 'Canada', 'Ireland', 'New Zealand', 'United States']}
        />
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Street address" htmlFor="location-address-line-1">
            <input id="location-address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
          </Field>
          <Field label="Address line 2" htmlFor="location-address-line-2">
            <input id="location-address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} />
          </Field>
          <Field label="Postal code" htmlFor="location-postal-code">
            <input id="location-postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
