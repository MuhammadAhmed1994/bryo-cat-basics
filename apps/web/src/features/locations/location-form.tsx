'use client';

import { FormEvent, useState } from 'react';
import { Banner } from '@/components/ui';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';

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

export interface LocationFormErrors {
  [field: string]: string | null | undefined;
}

interface LocationFormProps {
  onSubmit: (values: LocationFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  formError?: string | null;
  serverErrors?: LocationFormErrors;
}

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,}$/;

/** Add Location form, including its dependent, free-text geography fields. */
export function LocationForm({
  onSubmit,
  onCancel,
  submitting = false,
  formError = null,
  serverErrors = {},
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(EMPTY_LOCATION_FORM);
  const [errors, setErrors] = useState<LocationFormErrors>({});

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'country' ? { stateProvince: '', city: '' } : {}),
      ...(key === 'stateProvince' ? { city: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LocationFormErrors = {
      name: values.name.trim() ? null : 'Enter a location name.',
      phone:
        values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())
          ? 'Enter a valid phone number.'
          : null,
      contactPersonPhone:
        values.contactPersonPhone.trim() && !PHONE_PATTERN.test(values.contactPersonPhone.trim())
          ? 'Enter a valid phone number.'
          : null,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    void onSubmit(values);
  }

  const nameError = errors.name || serverErrors.name;
  const phoneError = errors.phone || serverErrors.phone;
  const contactPhoneError = errors.contactPersonPhone || serverErrors.contactPersonPhone;

  return (
    <form className="flex flex-col gap-4" aria-label="Add Location form" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}
      <section className="card px-7 py-6" aria-labelledby="location-details-heading">
        <h2 id="location-details-heading" className="mb-4 text-base font-semibold text-ink">
          Location details
        </h2>
        <p className="mb-5 text-sm text-ink-soft">Add the name and contact information for this location.</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="field">
              <label htmlFor="location-name">
                Location name <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="location-name"
                value={values.name}
                maxLength={100}
                required
                aria-required="true"
                aria-invalid={Boolean(nameError)}
                aria-describedby={`location-name-hint location-name-count${nameError ? ' location-name-error' : ''}`}
                onChange={(event) => update('name', event.target.value)}
              />
              {nameError && <p id="location-name-error" className="error" role="alert">{nameError}</p>}
              <p id="location-name-hint" className="hint">
                Name is required (100 characters maximum).
              </p>
              <p id="location-name-count" className="hint" aria-live="polite">
                {values.name.length} / 100 characters
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <CompanySingleSelect
              value={values.companyId}
              onChange={(companyId) => update('companyId', companyId)}
            />
          </div>
          <div className="field">
            <label htmlFor="location-phone">Location phone</label>
            <input
              id="location-phone"
              type="tel"
              value={values.phone}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? 'location-phone-error' : undefined}
              onChange={(event) => update('phone', event.target.value)}
            />
            {phoneError && <p id="location-phone-error" className="error" role="alert">{phoneError}</p>}
          </div>
          <div className="field">
            <label htmlFor="contact-person">Contact person</label>
            <input
              id="contact-person"
              value={values.contactPerson}
              onChange={(event) => update('contactPerson', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-person-phone">Contact person phone</label>
            <input
              id="contact-person-phone"
              type="tel"
              value={values.contactPersonPhone}
              aria-invalid={Boolean(contactPhoneError)}
              aria-describedby={contactPhoneError ? 'contact-person-phone-error' : undefined}
              onChange={(event) => update('contactPersonPhone', event.target.value)}
            />
            {contactPhoneError && (
              <p id="contact-person-phone-error" className="error" role="alert">{contactPhoneError}</p>
            )}
          </div>
        </div>
      </section>

      <section className="card px-7 py-6" aria-labelledby="location-address-heading">
        <h2 id="location-address-heading" className="mb-4 text-base font-semibold text-ink">Address</h2>
        <p className="mb-5 text-sm text-ink-soft">Enter the location’s mailing address.</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <div className="field">
              <label htmlFor="address-line-1">Address line 1</label>
              <input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
            </div>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <div className="field">
              <label htmlFor="address-line-2">Address line 2</label>
              <input id="address-line-2" value={values.addressLine2} placeholder="Suite, unit, floor (optional)" onChange={(event) => update('addressLine2', event.target.value)} />
            </div>
          </div>
          <TypeaheadField
            id="country"
            label="Country"
            value={values.country}
            onChange={(value) => update('country', value)}
            error={serverErrors.country}
            hint="Type a country name; entered text is saved."
          />
          <TypeaheadField
            id="state-province"
            label="State/Province"
            value={values.stateProvince}
            onChange={(value) => update('stateProvince', value)}
            disabled={!values.country.trim()}
            placeholder={values.country.trim() ? 'Enter a state or province' : 'Select a country first'}
            error={serverErrors.stateProvince}
            hint={!values.country.trim() ? 'Choose a Country to enable this field.' : 'Type a state or province; entered text is saved.'}
          />
          <TypeaheadField
            id="city"
            label="City"
            value={values.city}
            onChange={(value) => update('city', value)}
            disabled={!values.stateProvince.trim()}
            placeholder={values.stateProvince.trim() ? 'Enter a city' : 'Select a state or province first'}
            error={serverErrors.city}
            hint={!values.stateProvince.trim() ? 'Choose a State/Province to enable this field.' : 'Type a city; entered text is saved.'}
          />
          <div className="field">
            <label htmlFor="postal-code">Postal code</label>
            <input id="postal-code" value={values.postalCode} maxLength={20} onChange={(event) => update('postalCode', event.target.value)} />
          </div>
        </div>
        <p className="hint mt-5">
          Select a Country before entering State/Province; select State/Province before City.
        </p>
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Location'}
        </button>
      </div>
    </form>
  );
}

/** Normalize optional strings to null, and preserve a missing Company as null. */
export function toLocationPayload(values: LocationFormValues) {
  const optional = (value: string) => value.trim() || null;
  return {
    name: values.name.trim(),
    companyId: values.companyId || null,
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
