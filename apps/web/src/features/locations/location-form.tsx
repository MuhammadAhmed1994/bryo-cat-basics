'use client';

import { useState } from 'react';
import { Banner, Field } from '@/components/ui';
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
  name: '', companyId: null, phone: '', contactPerson: '', contactPersonPhone: '',
  addressLine1: '', addressLine2: '', country: '', stateProvince: '', city: '', postalCode: '',
};

interface LocationFormProps {
  submitting?: boolean;
  formError?: string | null;
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}

export function LocationForm({
  submitting = false,
  formError = null,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>({ ...EMPTY_LOCATION_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
    setErrors((current) => ({ ...current, country: '', stateProvince: '', city: '' }));
  }

  function updateState(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
    setErrors((current) => ({ ...current, stateProvince: '', city: '' }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const name = values.name.trim();
    if (!name) nextErrors.name = 'Enter a location name.';
    else if (name.length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';

    for (const key of ['phone', 'contactPersonPhone'] as const) {
      const phone = values[key].trim();
      if (phone && !/^\+?[0-9\s()-]{6,}$/.test(phone)) {
        nextErrors[key] = 'Enter a valid phone number.';
      }
    }

    if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) {
      nextErrors.country = 'Select a Country before entering State/Province or City.';
    }
    if (!values.stateProvince.trim() && values.city.trim()) {
      nextErrors.stateProvince = 'Select a State/Province before entering City.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate aria-label="Add Location form">
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-6 py-6" aria-labelledby="location-details-heading">
        <div className="mb-5">
          <h2 id="location-details-heading" className="text-lg font-semibold text-ink">Location details</h2>
          <p className="mt-1 text-sm text-ink-soft">Add the name and contact information for this location.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Location name" htmlFor="location-name" required>
              <input
                id="location-name"
                value={values.name}
                maxLength={100}
                required
                aria-describedby={errors.name ? 'location-name-error' : 'location-name-help'}
                aria-invalid={errors.name ? true : undefined}
                onChange={(event) => update('name', event.target.value)}
              />
              <p id="location-name-help" className="hint" aria-live="polite">
                Name is required (100 characters maximum). {values.name.length} of 100 characters.
              </p>
              {errors.name && <p id="location-name-error" className="error" role="alert">{errors.name}</p>}
            </Field>
          </div>
          <div className="md:col-span-2">
            <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} />
          </div>
          <Field label="Location phone" htmlFor="location-phone">
            <input
              id="location-phone"
              type="tel"
              value={values.phone}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? 'location-phone-error' : undefined}
              onChange={(event) => update('phone', event.target.value)}
            />
            {errors.phone && <p id="location-phone-error" className="error" role="alert">{errors.phone}</p>}
          </Field>
          <Field label="Contact Person" htmlFor="contact-person">
            <input id="contact-person" value={values.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
          </Field>
          <Field label="Contact Person phone" htmlFor="contact-person-phone">
            <input
              id="contact-person-phone"
              type="tel"
              value={values.contactPersonPhone}
              aria-invalid={errors.contactPersonPhone ? true : undefined}
              aria-describedby={errors.contactPersonPhone ? 'contact-person-phone-error' : undefined}
              onChange={(event) => update('contactPersonPhone', event.target.value)}
            />
            {errors.contactPersonPhone && <p id="contact-person-phone-error" className="error" role="alert">{errors.contactPersonPhone}</p>}
          </Field>
        </div>
      </section>

      <section className="card px-6 py-6" aria-labelledby="location-address-heading">
        <div className="mb-5">
          <h2 id="location-address-heading" className="text-lg font-semibold text-ink">Address</h2>
          <p className="mt-1 text-sm text-ink-soft">Enter the location’s mailing address.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Address line 1" htmlFor="address-line-1">
              <input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Address line 2" htmlFor="address-line-2">
              <input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} />
            </Field>
          </div>
          <TypeaheadField id="location-country" label="Country" value={values.country} onChange={updateCountry} error={errors.country} options={['Australia', 'Canada', 'Ireland', 'New Zealand', 'United States']} />
          <TypeaheadField
            id="location-state-province"
            label="State/Province"
            value={values.stateProvince}
            onChange={updateState}
            disabled={!values.country.trim()}
            placeholder={!values.country.trim() ? 'Select a Country first' : 'Type a state or province'}
            error={errors.stateProvince}
          />
          <TypeaheadField
            id="location-city"
            label="City"
            value={values.city}
            onChange={(city) => update('city', city)}
            disabled={!values.stateProvince.trim()}
            placeholder={!values.stateProvince.trim() ? 'Select a State/Province first' : 'Type a city'}
          />
          <Field label="Postal code" htmlFor="postal-code">
            <input id="postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
          </Field>
        </div>
        <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
          Select a Country before entering State/Province; select State/Province before City.
        </p>
      </section>

      <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-xs text-ink-soft"><span className="text-red-600">*</span> Required field</p>
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
