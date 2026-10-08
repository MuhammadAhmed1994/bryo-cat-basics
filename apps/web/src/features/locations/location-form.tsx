'use client';

import { FormEvent, useState } from 'react';
import { Company } from '@/lib/types';
import { Banner, Field } from '@/components/ui';
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
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  onSubmit: (values: LocationFormValues) => void;
  onCancel?: () => void;
}

function validOptionalPhone(value: string): boolean {
  const phone = value.trim();
  if (!phone) return true;
  return /^\+?[0-9\s()-]{6,}$/.test(phone) && (phone.match(/[0-9]/g)?.length ?? 0) >= 6;
}

/** Shared create/edit form. A supplied initial hierarchy is shown as saved. */
export function LocationForm({
  initialValues = {},
  companies = [],
  submitLabel,
  submitting = false,
  formError = null,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>({
    ...EMPTY_LOCATION_FORM,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const activeCompanies = companies.filter((company) => company.isActive);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function changeCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
  }

  function changeStateProvince(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = 'Location name is required.';
    else if (values.name.length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    if (!validOptionalPhone(values.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!validOptionalPhone(values.contactPersonPhone)) {
      nextErrors.contactPersonPhone = 'Enter a valid phone number.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSubmit(values);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate aria-label="Location form">
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Location details</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Location name" htmlFor="location-name" error={errors.name} hint="Name is required and must be 100 characters or fewer." required>
            <input
              id="location-name"
              value={values.name}
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => update('name', event.target.value)}
            />
          </Field>
          <Field label="Company" htmlFor="location-company" hint="Company is optional.">
            <select
              id="location-company"
              aria-label="Company"
              value={values.companyId}
              onChange={(event) => update('companyId', event.target.value)}
            >
              <option value="">No company</option>
              {activeCompanies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" htmlFor="location-description">
            <input id="location-description" value={values.description} onChange={(event) => update('description', event.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="location-phone" error={errors.phone}>
            <input id="location-phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => update('phone', event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Location contact</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Contact name" htmlFor="contact-name">
            <input id="contact-name" value={values.contactPersonName} onChange={(event) => update('contactPersonName', event.target.value)} />
          </Field>
          <Field label="Contact email" htmlFor="contact-email">
            <input id="contact-email" type="email" value={values.contactPersonEmail} onChange={(event) => update('contactPersonEmail', event.target.value)} />
          </Field>
          <Field label="Contact phone" htmlFor="contact-phone" error={errors.contactPersonPhone}>
            <input id="contact-phone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} onChange={(event) => update('contactPersonPhone', event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card px-6 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <p className="mb-4 text-sm text-ink-soft">Choose a country first, then select a state or province and city.</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <DependentLocationSelect label="Country" value={values.country} onChange={changeCountry} />
          <DependentLocationSelect
            label="State/Province"
            value={values.stateProvince}
            disabled={!values.country.trim()}
            placeholder={values.country.trim() ? 'Search or enter a state or province' : 'Select a country first'}
            onChange={changeStateProvince}
          />
          <DependentLocationSelect
            label="City"
            value={values.city}
            disabled={!values.stateProvince.trim()}
            placeholder={values.stateProvince.trim() ? 'Search or enter a city' : 'Select a state first'}
            onChange={(city) => update('city', city)}
          />
          <Field label="Address line 1" htmlFor="address-line-1">
            <input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
          </Field>
          <Field label="Address line 2" htmlFor="address-line-2">
            <input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} />
          </Field>
          <Field label="Postal code" htmlFor="postal-code">
            <input id="postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
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
