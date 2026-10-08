'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banner, Field, Toast } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { CreateLocationInput, createLocation } from './location-api';
import { CompanySingleSelect } from './company-single-select';
import { TypeaheadField } from './typeahead-field';

interface LocationFormValues {
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

type LocationField = keyof LocationFormValues;
type FormErrors = Partial<Record<LocationField, string>>;

const EMPTY_VALUES: LocationFormValues = {
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

function validate(values: LocationFormValues): FormErrors {
  const errors: FormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Enter a location name.';
  else if (name.length > 100) errors.name = 'Name cannot exceed 100 characters.';

  const validPhone = /^\+?(?=(?:\D*\d){7,15}\D*$)[0-9\s().-]+$/;
  if (values.phone.trim() && !validPhone.test(values.phone.trim())) {
    errors.phone = 'Enter a valid phone number.';
  }
  if (values.contactPersonPhone.trim() && !validPhone.test(values.contactPersonPhone.trim())) {
    errors.contactPersonPhone = 'Enter a valid phone number.';
  }
  return errors;
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function toCreateInput(values: LocationFormValues): CreateLocationInput {
  return {
    name: values.name.trim(),
    companyId: values.companyId ?? null,
    phone: nullable(values.phone),
    contactPerson: nullable(values.contactPerson),
    contactPersonPhone: nullable(values.contactPersonPhone),
    addressLine1: nullable(values.addressLine1),
    addressLine2: nullable(values.addressLine2),
    country: nullable(values.country),
    stateProvince: nullable(values.stateProvince),
    city: nullable(values.city),
    postalCode: nullable(values.postalCode),
  };
}

function fieldForServerMessage(message: string): LocationField | undefined {
  const normalized = message.toLowerCase();
  if (normalized.includes('phone')) {
    return normalized.includes('contact') ? 'contactPersonPhone' : 'phone';
  }
  if (normalized.includes('country') || normalized.includes('state') || normalized.includes('city')) {
    if (normalized.includes('country')) return 'country';
    if (normalized.includes('city')) return 'city';
    return 'stateProvince';
  }
  if (normalized.includes('name') || normalized.includes('location')) return 'name';
  return undefined;
}

/** Add a Location as Active and keep the user's values visible after failures. */
export function LocationForm() {
  const router = useRouter();
  const [values, setValues] = useState<LocationFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends LocationField>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function updateCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
    setErrors((current) => ({ ...current, country: undefined, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  function updateState(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
    setErrors((current) => ({ ...current, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await createLocation(toCreateInput(values));
      const message = 'Location added successfully';
      setSuccessMessage(message);
      // Keep the confirmation visible briefly, then return to the list with a
      // success query for the list screen to retain/show the toast on arrival.
      window.setTimeout(() => {
        router.push('/locations?success=Location%20added%20successfully');
      }, 1200);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Location could not be created. Review the highlighted fields and try again.';
      const field = fieldForServerMessage(message);
      if (field) setErrors((current) => ({ ...current, [field]: message }));
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const nameCountId = 'location-name-count';
  const nameErrorId = 'location-name-error';
  const nameHelpId = 'location-name-help';

  return (
    <>
      {successMessage && <Toast message={successMessage} />}
      <form onSubmit={handleSubmit} noValidate aria-label="Add Location form" className="flex flex-col gap-4">
        {formError && <Banner kind="error">{formError}</Banner>}

        <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-details-title">
          <header className="mb-5">
            <h2 id="location-details-title" className="text-lg font-semibold text-ink">Location details</h2>
            <p className="mt-1 text-sm text-ink-soft">Add the name and contact information for this location.</p>
          </header>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Location name" htmlFor="location-name" error={errors.name} required>
                <input
                  id="location-name"
                  name="name"
                  value={values.name}
                  maxLength={100}
                  required
                  aria-describedby={`${nameHelpId} ${nameCountId}${errors.name ? ` ${nameErrorId}` : ''}`}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => update('name', event.target.value)}
                />
                <div id={nameHelpId} className="mt-1 flex justify-between gap-3 text-xs text-ink-soft">
                  <span>Name is required (100 characters maximum).</span>
                  <span id={nameCountId} aria-live="polite" className="shrink-0">{values.name.length} / 100</span>
                </div>
                {errors.name && <span id={nameErrorId} className="sr-only">{errors.name}</span>}
              </Field>
            </div>

            <div className="md:col-span-2">
              <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} />
            </div>
            <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
              <input
                id="location-phone"
                type="tel"
                value={values.phone}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'location-phone-error' : undefined}
                onChange={(event) => update('phone', event.target.value)}
              />
              {errors.phone && <span id="location-phone-error" className="sr-only">{errors.phone}</span>}
            </Field>
            <Field label="Contact person" htmlFor="contact-person">
              <input
                id="contact-person"
                value={values.contactPerson}
                onChange={(event) => update('contactPerson', event.target.value)}
              />
            </Field>
            <Field label="Contact person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
              <input
                id="contact-person-phone"
                type="tel"
                value={values.contactPersonPhone}
                aria-invalid={Boolean(errors.contactPersonPhone)}
                aria-describedby={errors.contactPersonPhone ? 'contact-person-phone-error' : undefined}
                onChange={(event) => update('contactPersonPhone', event.target.value)}
              />
              {errors.contactPersonPhone && <span id="contact-person-phone-error" className="sr-only">{errors.contactPersonPhone}</span>}
            </Field>
          </div>
        </section>

        <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-address-title">
          <header className="mb-5">
            <h2 id="location-address-title" className="text-lg font-semibold text-ink">Address</h2>
            <p className="mt-1 text-sm text-ink-soft">Enter the location’s mailing address.</p>
          </header>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Address line 1" htmlFor="address-line-1">
                <input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
              </Field>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Address line 2" htmlFor="address-line-2">
                <input id="address-line-2" value={values.addressLine2} placeholder="Suite, unit, floor (optional)" onChange={(event) => update('addressLine2', event.target.value)} />
              </Field>
            </div>
            <TypeaheadField
              id="location-country"
              label="Country"
              value={values.country}
              error={errors.country}
              onChange={updateCountry}
            />
            <TypeaheadField
              id="location-state-province"
              label="State/Province"
              value={values.stateProvince}
              disabled={!values.country.trim()}
              error={errors.stateProvince}
              onChange={updateState}
            />
            <TypeaheadField
              id="location-city"
              label="City"
              value={values.city}
              disabled={!values.stateProvince.trim()}
              error={errors.city}
              onChange={(city) => update('city', city)}
            />
            <Field label="Postal code" htmlFor="postal-code">
              <input id="postal-code" value={values.postalCode} maxLength={20} onChange={(event) => update('postalCode', event.target.value)} />
            </Field>
          </div>
          <p className="mt-5 rounded-lg bg-canvas px-3 py-2.5 text-xs leading-5 text-ink-soft">
            Select a Country before entering State/Province; select State/Province before City.
          </p>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-soft"><span className="text-red-500">*</span> Required field</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn--ghost" onClick={() => router.push('/locations')}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Location'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
