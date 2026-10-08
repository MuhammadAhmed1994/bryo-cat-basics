'use client';

import { useState } from 'react';
import type { Company } from '@/lib/types';
import { Banner, Field } from '@/components/ui';
import { DependentLocationSelect } from './dependent-location-select';

export interface LocationFormValues {
  name: string;
  description: string;
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
  description: '',
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

export function locationToForm(location: Partial<LocationFormValues> & { companyId?: string | null }): LocationFormValues {
  return {
    name: location.name ?? '',
    description: location.description ?? '',
    companyId: location.companyId ?? '',
    contactPersonName: location.contactPersonName ?? '',
    contactPersonEmail: location.contactPersonEmail ?? '',
    contactPersonPhone: location.contactPersonPhone ?? '',
    phone: location.phone ?? '',
    addressLine1: location.addressLine1 ?? '',
    addressLine2: location.addressLine2 ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    postalCode: location.postalCode ?? '',
  };
}

export interface LocationFormProps {
  initialValues?: LocationFormValues;
  companies?: Company[];
  submitLabel?: string;
  submitting?: boolean;
  formError?: string | null;
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}

/** Shared create/edit Location form. */
export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  companies = [],
  submitLabel = 'Save Location',
  submitting = false,
  formError = null,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(() => ({ ...initialValues }));
  const [nameError, setNameError] = useState<string | null>(null);
  const activeCompanies = companies.filter((company) => company.isActive);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setNameError('Enter a location name.');
      return;
    }
    if (trimmedName.length > 100) {
      setNameError('Location name must be 100 characters or fewer.');
      return;
    }
    setNameError(null);
    onSubmit(values);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <h2 className="mb-1 text-base font-semibold text-ink">Location details</h2>
        <p className="mb-5 text-sm text-ink-soft">Add a name and contact information for this location.</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field
            label="Location name"
            htmlFor="location-name"
            error={nameError}
            hint="Name is required and must be 100 characters or fewer."
            required
          >
            <input
              id="location-name"
              value={values.name}
              maxLength={101}
              aria-invalid={Boolean(nameError)}
              onChange={(event) => {
                update('name', event.target.value);
                if (nameError) setNameError(null);
              }}
            />
          </Field>

          <Field label="Company" htmlFor="location-company" hint="Company is optional.">
            <select
              id="location-company"
              value={values.companyId}
              onChange={(event) => update('companyId', event.target.value)}
            >
              <option value="">No Company</option>
              {activeCompanies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            {companies.length > 0 && activeCompanies.length === 0 && (
              <p className="hint">No active Companies available.</p>
            )}
          </Field>

          <Field label="Contact name" htmlFor="location-contact-name">
            <input id="location-contact-name" value={values.contactPersonName} onChange={(event) => update('contactPersonName', event.target.value)} />
          </Field>
          <Field label="Contact email" htmlFor="location-contact-email">
            <input id="location-contact-email" type="email" value={values.contactPersonEmail} onChange={(event) => update('contactPersonEmail', event.target.value)} />
          </Field>
          <Field label="Contact phone" htmlFor="location-contact-phone">
            <input id="location-contact-phone" type="tel" value={values.contactPersonPhone} onChange={(event) => update('contactPersonPhone', event.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="location-phone">
            <input id="location-phone" type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
          </Field>
          <Field label="Description" htmlFor="location-description">
            <textarea id="location-description" value={values.description} onChange={(event) => update('description', event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-1 text-base font-semibold text-ink">Address</h2>
        <p className="mb-5 text-sm text-ink-soft">Choose a country first, then select a state or province and city.</p>
        <DependentLocationSelect
          country={values.country}
          stateProvince={values.stateProvince}
          city={values.city}
          onCountryChange={(country) => setValues((current) => ({
            ...current, country, stateProvince: '', city: '',
          }))}
          onStateProvinceChange={(stateProvince) => setValues((current) => ({
            ...current, stateProvince, city: '',
          }))}
          onCityChange={(city) => update('city', city)}
        />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Address line 1" htmlFor="location-address-line-1">
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
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Blank optional values become null; an unselected Company explicitly clears the association. */
export function toLocationPayload(values: LocationFormValues) {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    description: optional(values.description),
    companyId: optional(values.companyId),
    contactPersonName: optional(values.contactPersonName),
    contactPersonEmail: optional(values.contactPersonEmail),
    contactPersonPhone: optional(values.contactPersonPhone),
    phone: optional(values.phone),
    addressLine1: optional(values.addressLine1),
    addressLine2: optional(values.addressLine2),
    country: optional(values.country),
    stateProvince: optional(values.stateProvince),
    city: optional(values.city),
    postalCode: optional(values.postalCode),
  };
}
