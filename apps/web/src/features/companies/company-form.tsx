'use client';

import { useState } from 'react';
import { Address, Company } from '@/lib/types';
import {
  isClean,
  validateCompanyName,
  validateCompanyPhone,
  validateOptionalEmail,
  validateOptionalWebsite,
} from '@/lib/validation';
import { Banner, Field } from '@/components/ui';

export interface CompanyFormValues {
  name: string;
  phone: string;
  email: string;
  website: string;
  billingAddress: AddressValues;
  shippingSameAsBilling: boolean;
  shippingAddress: AddressValues;
}

export interface AddressValues {
  line1: string;
  line2: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
}

const EMPTY_ADDRESS: AddressValues = {
  line1: '',
  line2: '',
  country: '',
  state: '',
  city: '',
  postalCode: '',
};

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: '',
  phone: '',
  email: '',
  website: '',
  billingAddress: { ...EMPTY_ADDRESS },
  shippingSameAsBilling: true,
  shippingAddress: { ...EMPTY_ADDRESS },
};

function addressToValues(address: Address | undefined): AddressValues {
  return {
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    country: address?.country ?? '',
    state: address?.state ?? '',
    city: address?.city ?? '',
    postalCode: address?.postalCode ?? '',
  };
}

export function companyToForm(company: Company): CompanyFormValues {
  return {
    name: company.name,
    phone: company.phone,
    email: company.email ?? '',
    website: company.website ?? '',
    billingAddress: addressToValues(company.billingAddress),
    shippingSameAsBilling: company.shippingSameAsBilling,
    shippingAddress: addressToValues(company.shippingAddress),
  };
}

/**
 * Spec 2.9 lists countries/states/cities as searchable dropdowns sourced from a
 * reference dataset. Until that dataset exists these are datalist-backed text
 * inputs: type-ahead works and the stored value is identical.
 */
const COUNTRIES = ['Australia', 'New Zealand', 'United States', 'Canada', 'Ireland'];

interface CompanyFormProps {
  initialValues?: CompanyFormValues;
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  /** Edit screens disable the button until something actually changes. */
  requireChange?: boolean;
  onSubmit: (values: CompanyFormValues) => void;
  onCancel: () => void;
}

export function CompanyForm({
  initialValues = EMPTY_COMPANY_FORM,
  submitLabel,
  submitting = false,
  formError = null,
  requireChange = false,
  onSubmit,
  onCancel,
}: CompanyFormProps) {
  const [values, setValues] = useState<CompanyFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function updateAddress(
    which: 'billingAddress' | 'shippingAddress',
    key: keyof AddressValues,
    value: string,
  ) {
    setValues((current) => ({ ...current, [which]: { ...current[which], [key]: value } }));
    setDirty(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = {
      name: validateCompanyName(values.name),
      phone: validateCompanyPhone(values.phone),
      email: validateOptionalEmail(values.email),
      website: validateOptionalWebsite(values.website),
    };
    setErrors(nextErrors);
    if (!isClean(nextErrors)) return;

    onSubmit(values);
  }

  const disabled = submitting || (requireChange && !dirty);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Name" htmlFor="name" error={errors.name} required>
            <input
              id="name"
              value={values.name}
              maxLength={100}
              onChange={(event) => update('name', event.target.value)}
            />
          </Field>

          <Field label="Phone" htmlFor="phone" error={errors.phone} required>
            <input
              id="phone"
              value={values.phone}
              placeholder="+61 400 000 000"
              onChange={(event) => update('phone', event.target.value)}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              type="email"
              value={values.email}
              placeholder="name@example.com"
              onChange={(event) => update('email', event.target.value)}
            />
          </Field>

          <Field label="Website" htmlFor="website" error={errors.website}>
            <input
              id="website"
              value={values.website}
              placeholder="https://example.com"
              onChange={(event) => update('website', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <AddressFields
        legend="Billing Address"
        idPrefix="billing"
        values={values.billingAddress}
        onChange={(key, value) => updateAddress('billingAddress', key, value)}
      />

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Shipping Address</h2>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.shippingSameAsBilling}
            onChange={(event) => update('shippingSameAsBilling', event.target.checked)}
          />
          Same as billing address
        </label>

        {/* Spec 2.8.1 — the shipping block only appears when the box is cleared. */}
        {!values.shippingSameAsBilling && (
          <AddressFields
            legend=""
            idPrefix="shipping"
            values={values.shippingAddress}
            onChange={(key, value) => updateAddress('shippingAddress', key, value)}
          />
        )}
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={disabled}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

interface AddressFieldsProps {
  legend: string;
  idPrefix: string;
  values: AddressValues;
  onChange: (key: keyof AddressValues, value: string) => void;
}

function AddressFields({ legend, idPrefix, values, onChange }: AddressFieldsProps) {
  // Spec 2.8.1 — State is enabled once Country is set, City once State is set.
  const stateDisabled = !values.country.trim();
  const cityDisabled = !values.state.trim();

  return (
    <section className={legend ? 'card px-7 py-6' : 'mt-6'}>
      {legend && <h2 className="mb-4 text-base font-semibold text-ink">{legend}</h2>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Address Line 1" htmlFor={`${idPrefix}Line1`}>
          <input
            id={`${idPrefix}Line1`}
            value={values.line1}
            placeholder="Street address"
            onChange={(event) => onChange('line1', event.target.value)}
          />
        </Field>

        <Field label="Address Line 2" htmlFor={`${idPrefix}Line2`}>
          <input
            id={`${idPrefix}Line2`}
            value={values.line2}
            placeholder="Suite, unit, etc."
            onChange={(event) => onChange('line2', event.target.value)}
          />
        </Field>

        <Field label="Country" htmlFor={`${idPrefix}Country`}>
          <input
            id={`${idPrefix}Country`}
            value={values.country}
            list={`${idPrefix}-countries`}
            placeholder="Select a country"
            onChange={(event) => onChange('country', event.target.value)}
          />
          <datalist id={`${idPrefix}-countries`}>
            {COUNTRIES.map((country) => (
              <option key={country} value={country} />
            ))}
          </datalist>
        </Field>

        <Field label="State/Province" htmlFor={`${idPrefix}State`}>
          <input
            id={`${idPrefix}State`}
            value={values.state}
            disabled={stateDisabled}
            placeholder={stateDisabled ? 'Select a country first' : 'Select a state or province'}
            onChange={(event) => onChange('state', event.target.value)}
          />
        </Field>

        <Field label="City" htmlFor={`${idPrefix}City`}>
          <input
            id={`${idPrefix}City`}
            value={values.city}
            disabled={cityDisabled}
            placeholder={cityDisabled ? 'Select a state first' : 'Select a city'}
            onChange={(event) => onChange('city', event.target.value)}
          />
        </Field>

        <Field label="Postal Code" htmlFor={`${idPrefix}PostalCode`}>
          <input
            id={`${idPrefix}PostalCode`}
            value={values.postalCode}
            maxLength={20}
            onChange={(event) => onChange('postalCode', event.target.value)}
          />
        </Field>
      </div>
    </section>
  );
}

/** Blank strings become nulls so the API stores "not provided", not "". */
export function toCompanyPayload(values: CompanyFormValues) {
  const address = (a: AddressValues) => ({
    line1: a.line1.trim() || null,
    line2: a.line2.trim() || null,
    country: a.country.trim() || null,
    state: a.state.trim() || null,
    city: a.city.trim() || null,
    postalCode: a.postalCode.trim() || null,
  });

  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email.trim() || null,
    website: values.website.trim() || null,
    billingAddress: address(values.billingAddress),
    shippingSameAsBilling: values.shippingSameAsBilling,
    shippingAddress: values.shippingSameAsBilling
      ? address(values.billingAddress)
      : address(values.shippingAddress),
  };
}
