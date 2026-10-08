'use client';

import { FormEvent, useState } from 'react';
import { ApiError } from '@/lib/api';
import { LocationInput } from './location-api';
import { CompanySingleSelect } from './company-single-select';
import { TypeaheadField } from './typeahead-field';
import { Banner, Field } from '@/components/ui';

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

type LocationField = keyof LocationFormValues;
type FieldErrors = Partial<Record<LocationField, string>>;

interface LocationFormProps {
  onSubmit: (values: LocationInput) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const COUNTRIES = ['Australia', 'Canada', 'Ireland', 'New Zealand', 'United States'];
const STATES = ['California', 'New South Wales', 'Ontario', 'Queensland'];
const CITIES = ['Oakland', 'Dubbo', 'Toronto', 'Brisbane'];
const PHONE_PATTERN = /^\+?[0-9\s()-]{6,30}$/;

function mapApiError(message: string): { fieldErrors: FieldErrors; formMessage: string } {
  const lower = message.toLowerCase();
  const fieldErrors: FieldErrors = {};
  if (lower.includes('phone')) {
    fieldErrors[lower.includes('contact') ? 'contactPersonPhone' : 'phone'] = message;
  } else if (lower.includes('country') || lower.includes('state') || lower.includes('city') || lower.includes('geograph')) {
    const key: LocationField = lower.includes('country')
      ? 'country'
      : lower.includes('state')
        ? 'stateProvince'
        : 'city';
    fieldErrors[key] = message;
  } else if (lower.includes('name') || lower.includes('location')) {
    fieldErrors.name = message;
  }
  return { fieldErrors, formMessage: message || 'Location could not be created. Review the highlighted fields and try again.' };
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}

/** Creation form; user values remain controlled if the server rejects a submission. */
export function LocationForm({ onSubmit, onCancel, submitting = false }: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(EMPTY_LOCATION_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends LocationField>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function changeCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
    setErrors((current) => ({ ...current, country: undefined, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  function changeState(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
    setErrors((current) => ({ ...current, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    else if (values.name.length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (values.contactPersonPhone.trim() && !PHONE_PATTERN.test(values.contactPersonPhone.trim())) {
      nextErrors.contactPersonPhone = 'Enter a valid phone number.';
    }
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        companyId: values.companyId ?? null,
        phone: optionalText(values.phone),
        contactPerson: optionalText(values.contactPerson),
        contactPersonPhone: optionalText(values.contactPersonPhone),
        addressLine1: optionalText(values.addressLine1),
        addressLine2: optionalText(values.addressLine2),
        country: optionalText(values.country),
        stateProvince: optionalText(values.stateProvince),
        city: optionalText(values.city),
        postalCode: optionalText(values.postalCode),
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Location could not be created. Review the highlighted fields and try again.';
      const mapped = mapApiError(message);
      setErrors(mapped.fieldErrors);
      setFormError(mapped.formMessage);
    } finally {
      setSaving(false);
    }
  }

  const isSubmitting = saving || submitting;

  return (
    <form className="flex flex-col gap-4" aria-label="Add Location form" onSubmit={submit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}
      <section className="card px-7 py-6" aria-labelledby="location-details-heading">
        <div className="mb-5">
          <h2 id="location-details-heading" className="text-base font-semibold text-ink">Location details</h2>
          <p className="hint">Add the name and contact information for this location.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Location name" htmlFor="location-name" error={errors.name} hint="Name is required (100 characters maximum)." required>
              <input
                id="location-name"
                value={values.name}
                maxLength={100}
                required
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'location-name-error location-name-count' : 'location-name-help location-name-count'}
                onChange={(event) => update('name', event.target.value)}
              />
              <span id="location-name-help" className="sr-only">Name is required (100 characters maximum).</span>
              <span id="location-name-count" className="hint" aria-live="polite">{values.name.length} / 100</span>
              {errors.name && <span id="location-name-error" className="sr-only">{errors.name}</span>}
            </Field>
          </div>
          <div className="md:col-span-2">
            <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} error={errors.companyId} />
          </div>
          <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
            <input id="location-phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'location-phone-error' : undefined} onChange={(event) => update('phone', event.target.value)} />
            {errors.phone && <span id="location-phone-error" className="sr-only">{errors.phone}</span>}
          </Field>
          <Field label="Contact person" htmlFor="contact-person" error={errors.contactPerson}>
            <input id="contact-person" value={values.contactPerson} aria-invalid={Boolean(errors.contactPerson)} aria-describedby={errors.contactPerson ? 'contact-person-error' : undefined} onChange={(event) => update('contactPerson', event.target.value)} />
            {errors.contactPerson && <span id="contact-person-error" className="sr-only">{errors.contactPerson}</span>}
          </Field>
          <Field label="Contact person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
            <input id="contact-person-phone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} aria-describedby={errors.contactPersonPhone ? 'contact-person-phone-error' : undefined} onChange={(event) => update('contactPersonPhone', event.target.value)} />
            {errors.contactPersonPhone && <span id="contact-person-phone-error" className="sr-only">{errors.contactPersonPhone}</span>}
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6" aria-labelledby="location-address-heading">
        <div className="mb-5">
          <h2 id="location-address-heading" className="text-base font-semibold text-ink">Address</h2>
          <p className="hint">Enter the location’s mailing address.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Address line 1" htmlFor="address-line-1">
              <input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Address line 2" htmlFor="address-line-2">
              <input id="address-line-2" value={values.addressLine2} placeholder="Suite, unit, floor (optional)" onChange={(event) => update('addressLine2', event.target.value)} />
            </Field>
          </div>
          <TypeaheadField id="country" label="Country" value={values.country} options={COUNTRIES} onChange={changeCountry} error={errors.country} />
          <TypeaheadField id="state-province" label="State/Province" value={values.stateProvince} options={STATES} onChange={changeState} disabled={!values.country.trim()} disabledHint="Select a Country first." error={errors.stateProvince} />
          <TypeaheadField id="city" label="City" value={values.city} options={CITIES} onChange={(city) => update('city', city)} disabled={!values.stateProvince.trim()} disabledHint="Select State/Province first." error={errors.city} />
          <Field label="Postal code" htmlFor="postal-code" error={errors.postalCode}>
            <input id="postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
          </Field>
        </div>
        <p className="mt-4 rounded-md bg-canvas p-3 text-xs text-ink-soft">
          Select a Country before entering State/Province; select State/Province before City.
        </p>
      </section>

      <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <span className="hint"><span aria-hidden="true">*</span> Required field</span>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Location'}
          </button>
        </div>
      </div>
    </form>
  );
}
