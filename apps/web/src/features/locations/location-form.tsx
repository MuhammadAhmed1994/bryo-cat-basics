'use client';

import { FormEvent, useState } from 'react';
import { Banner, Field } from '@/components/ui';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';
import { LocationInput } from '@/features/locations/location-api';

export interface LocationFormValues {
  name: string;
  companyId: string | null;
  phone: string;
  contactPerson: string;
  contactPersonPhone: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  stateProvince: string;
  city: string;
  postalCode: string;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
  name: '',
  companyId: null,
  phone: '',
  contactPerson: '',
  contactPersonPhone: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  stateProvince: '',
  city: '',
  postalCode: '',
};

export function toLocationPayload(values: LocationFormValues): LocationInput {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    companyId: values.companyId ?? null,
    phone: optional(values.phone),
    contactPerson: optional(values.contactPerson),
    contactPersonPhone: optional(values.contactPersonPhone),
    addressLine1: optional(values.addressLine1),
    addressLine2: optional(values.addressLine2),
    country: optional(values.country),
    stateProvince: optional(values.stateProvince),
    city: optional(values.city),
    postalCode: optional(values.postalCode),
  };
}

interface LocationFormProps {
  onSubmit: (values: LocationInput) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  formError?: string | null;
}

export function LocationForm({ onSubmit, onCancel, submitting = false, formError = null }: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>({ ...EMPTY_LOCATION_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function changeCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
    setErrors((current) => ({ ...current, country: '', stateProvince: '', city: '' }));
  }

  function changeState(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
    setErrors((current) => ({ ...current, stateProvince: '', city: '' }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    if (values.name.trim().length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    if (values.phone.trim() && !/^\+?[0-9\s()-]{6,}$/.test(values.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (values.contactPersonPhone.trim() && !/^\+?[0-9\s()-]{6,}$/.test(values.contactPersonPhone.trim())) {
      nextErrors.contactPersonPhone = 'Enter a valid phone number.';
    }
    if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) {
      nextErrors.country = 'Select a country before entering a state or city.';
    }
    if (!values.stateProvince.trim() && values.city.trim()) {
      nextErrors.stateProvince = 'Select a state or province before entering a city.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSubmit(toLocationPayload(values));
  }

  const stateDisabled = !values.country.trim();
  const cityDisabled = !values.stateProvince.trim();

  return (
    <form className="flex flex-col gap-4" aria-label="Add Location form" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}
      <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-details-heading">
        <h2 id="location-details-heading" className="mb-5 text-lg font-semibold text-ink">Location details</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Location name" htmlFor="location-name" error={errors.name} hint="Name is required (100 characters maximum)." required>
            <input
              id="location-name"
              name="name"
              value={values.name}
              maxLength={100}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={`location-name-help location-name-count${errors.name ? ' location-name-error' : ''}`}
              onChange={(event) => update('name', event.target.value)}
            />
            <span id="location-name-help" className="sr-only">Name is required and limited to 100 characters.</span>
            <span id="location-name-count" className="sr-only" aria-live="polite">{values.name.length} of 100 characters</span>
            {errors.name && <span id="location-name-error" className="sr-only">{errors.name}</span>}
          </Field>
          <div className="md:col-span-2">
            <CompanySingleSelect
              value={values.companyId}
              onChange={(companyId) => update('companyId', companyId)}
              id="location-company"
              disabled={submitting}
            />
          </div>
          <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
            <input id="location-phone" name="phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'location-phone-error' : undefined} onChange={(event) => update('phone', event.target.value)} />
            {errors.phone && <span id="location-phone-error" className="sr-only">{errors.phone}</span>}
          </Field>
          <Field label="Contact Person" htmlFor="contact-person">
            <input id="contact-person" name="contactPerson" value={values.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
          </Field>
          <Field label="Contact Person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
            <input id="contact-person-phone" name="contactPersonPhone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} aria-describedby={errors.contactPersonPhone ? 'contact-person-phone-error' : undefined} onChange={(event) => update('contactPersonPhone', event.target.value)} />
            {errors.contactPersonPhone && <span id="contact-person-phone-error" className="sr-only">{errors.contactPersonPhone}</span>}
          </Field>
        </div>
      </section>

      <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-address-heading">
        <h2 id="location-address-heading" className="mb-5 text-lg font-semibold text-ink">Address</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Address line 1" htmlFor="address-line-1">
              <input id="address-line-1" name="addressLine1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Address line 2" htmlFor="address-line-2">
              <input id="address-line-2" name="addressLine2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} />
            </Field>
          </div>
          <TypeaheadField id="location-country" label="Country" value={values.country} onChange={changeCountry} error={errors.country} />
          <TypeaheadField id="location-state" label="State/Province" value={values.stateProvince} onChange={changeState} disabled={stateDisabled} placeholder={stateDisabled ? 'Select a country first' : undefined} error={errors.stateProvince} />
          <TypeaheadField id="location-city" label="City" value={values.city} onChange={(city) => update('city', city)} disabled={cityDisabled} placeholder={cityDisabled ? 'Select a state or province first' : undefined} error={errors.city} />
          <Field label="Postal code" htmlFor="postal-code">
            <input id="postal-code" name="postalCode" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
          </Field>
        </div>
        <p className="mt-5 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
          Select a Country before entering State/Province; select State/Province before City.
        </p>
      </section>

      <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
        <span className="text-xs text-ink-soft"><span className="text-red-600">*</span> Required field</span>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Location'}
          </button>
        </div>
      </div>
    </form>
  );
}
