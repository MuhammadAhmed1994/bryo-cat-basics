'use client';

import { useState, type FormEvent } from 'react';
import { Banner, Field } from '@/components/ui';
import type { Company } from '@/lib/types';
import { DependentLocationSelect } from './dependent-location-select';

export interface LocationFormValues {
  name: string;
  description: string;
  companyId: string;
  phone: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  stateProvince: string;
  city: string;
  postalCode: string;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
  name: '',
  description: '',
  companyId: '',
  phone: '',
  contactPersonName: '',
  contactPersonPhone: '',
  contactPersonEmail: '',
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
  onCancel: () => void;
}

function toFormValues(values?: Partial<LocationFormValues>): LocationFormValues {
  return { ...EMPTY_LOCATION_FORM, ...values };
}

/** Shared create/edit form; saved values seed the same dependent fields. */
export function LocationForm({
  initialValues,
  companies = [],
  submitLabel = 'Save Location',
  submitting = false,
  formError = null,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState(() => toFormValues(initialValues));
  const [nameError, setNameError] = useState<string | null>(null);
  const activeCompanies = companies.filter((company) => company.isActive);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateCountry(country: string) {
    setValues((current) => ({
      ...current,
      country,
      stateProvince: '',
      city: '',
    }));
  }

  function updateStateProvince(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    if (!name) {
      setNameError('Location name is required.');
      return;
    }
    if (name.length > 100) {
      setNameError('Location name must be 100 characters or fewer.');
      return;
    }
    setNameError(null);
    onSubmit({ ...values, name });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate aria-label="Location form">
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Location details</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="field">
            <label htmlFor="location-name">
              Location name <span className="required"> *</span>
            </label>
            <input
              id="location-name"
              value={values.name}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'location-name-error' : 'location-name-hint'}
              onChange={(event) => {
                update('name', event.target.value);
                if (nameError) setNameError(null);
              }}
            />
            {nameError ? (
              <p id="location-name-error" className="error" role="alert">
                {nameError}
              </p>
            ) : (
              <p id="location-name-hint" className="hint">
                Name is required and must be 100 characters or fewer.
              </p>
            )}
          </div>

          <Field label="Company" htmlFor="location-company" hint="Company is optional.">
            <select
              id="location-company"
              value={values.companyId}
              onChange={(event) => update('companyId', event.target.value)}
            >
              <option value="">No company</option>
              {activeCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Contact name" htmlFor="contact-person-name">
            <input
              id="contact-person-name"
              value={values.contactPersonName}
              onChange={(event) => update('contactPersonName', event.target.value)}
            />
          </Field>
          <Field label="Contact email" htmlFor="contact-person-email">
            <input
              id="contact-person-email"
              type="email"
              value={values.contactPersonEmail}
              onChange={(event) => update('contactPersonEmail', event.target.value)}
            />
          </Field>
          <Field label="Contact phone" htmlFor="contact-person-phone">
            <input
              id="contact-person-phone"
              type="tel"
              value={values.contactPersonPhone}
              onChange={(event) => update('contactPersonPhone', event.target.value)}
            />
          </Field>
          <Field label="Location phone" htmlFor="location-phone">
            <input
              id="location-phone"
              type="tel"
              value={values.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Choose a country first, then select a state or province and city.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DependentLocationSelect
            id="location-country"
            label="Country"
            value={values.country}
            onChange={updateCountry}
          />
          <DependentLocationSelect
            id="location-state-province"
            label="State/Province"
            value={values.stateProvince}
            disabled={!values.country.trim()}
            placeholder={values.country.trim() ? 'Enter a state or province' : 'Select a country first'}
            helperText={!values.country.trim() ? 'Choose a country to enable this field.' : undefined}
            onChange={updateStateProvince}
          />
          <DependentLocationSelect
            id="location-city"
            label="City"
            value={values.city}
            disabled={!values.stateProvince.trim()}
            placeholder={values.stateProvince.trim() ? 'Enter a city' : 'Select a state or province first'}
            helperText={!values.stateProvince.trim() ? 'Choose a state or province to enable this field.' : undefined}
            onChange={(city) => update('city', city)}
          />
          <Field label="Address line 1" htmlFor="address-line-1">
            <input
              id="address-line-1"
              value={values.addressLine1}
              onChange={(event) => update('addressLine1', event.target.value)}
            />
          </Field>
          <Field label="Address line 2" htmlFor="address-line-2">
            <input
              id="address-line-2"
              value={values.addressLine2}
              onChange={(event) => update('addressLine2', event.target.value)}
            />
          </Field>
          <Field label="Postal code" htmlFor="postal-code">
            <input
              id="postal-code"
              value={values.postalCode}
              onChange={(event) => update('postalCode', event.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="location-description">
            <textarea
              id="location-description"
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
