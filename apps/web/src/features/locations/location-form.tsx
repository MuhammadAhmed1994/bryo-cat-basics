'use client';

import { useMemo, useState } from 'react';
import { Banner, Field } from '@/components/ui';
import { CompanySelect } from './company-select';
import { GeoCascadeField, GeoCascadeValue } from './geo-cascade-field';

export interface LocationFormValues {
  name: string;
  companyId: string | null;
  phone: string;
  contactName: string;
  contactPhone: string;
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
  contactName: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  stateProvince: '',
  city: '',
  postalCode: '',
};

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  submitLabel,
  submitting = false,
  formError = null,
  requireChange = false,
  currentCompany,
  onSubmit,
  onCancel,
}: {
  initialValues?: LocationFormValues;
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  requireChange?: boolean;
  currentCompany?: { id: string; name: string; isActive: boolean } | null;
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function updateGeo(next: GeoCascadeValue) {
    setValues((current) => ({
      ...current,
      country: next.country,
      stateProvince: next.stateProvince,
      city: next.city,
    }));
    setDirty(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = {
      name: values.name.trim() ? null : 'Enter a location name',
      phone: null as string | null,
      contactPhone: null as string | null,
    };
    setErrors(nextErrors);
    if (nextErrors.name) return;

    onSubmit(values);
  }

  const disabled = submitting || (requireChange && !dirty);

  const geoValue = useMemo<GeoCascadeValue>(
    () => ({ country: values.country, stateProvince: values.stateProvince, city: values.city }),
    [values.country, values.stateProvince, values.city],
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name} required>
            <input
              id="name"
              value={values.name}
              maxLength={100}
              onChange={(e) => update('name', e.target.value)}
            />
          </Field>

          <CompanySelect
            value={values.companyId}
            onChange={(id) => update('companyId', id)}
            currentCompany={currentCompany ?? null}
          />
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Contact</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field label="Phone" htmlFor="phone">
            <input
              id="phone"
              value={values.phone}
              placeholder="+61 400 000 000"
              onChange={(e) => update('phone', e.target.value)}
            />
          </Field>
          <Field label="Contact Person Name" htmlFor="contactName">
            <input
              id="contactName"
              value={values.contactName}
              onChange={(e) => update('contactName', e.target.value)}
            />
          </Field>
          <Field label="Contact Person's Phone" htmlFor="contactPhone">
            <input
              id="contactPhone"
              value={values.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <GeoCascadeField value={geoValue} onChange={updateGeo} idPrefix="loc" />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field label="Address Line 1" htmlFor="address1">
            <input
              id="address1"
              value={values.addressLine1}
              placeholder="Street address"
              onChange={(e) => update('addressLine1', e.target.value)}
            />
          </Field>
          <Field label="Address Line 2" htmlFor="address2">
            <input
              id="address2"
              value={values.addressLine2}
              placeholder="Suite, unit, etc."
              onChange={(e) => update('addressLine2', e.target.value)}
            />
          </Field>
          <Field label="Postal Code" htmlFor="postalCode">
            <input
              id="postalCode"
              value={values.postalCode}
              maxLength={20}
              onChange={(e) => update('postalCode', e.target.value)}
            />
          </Field>
        </div>
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

/** Trim values and convert blanks to nulls for the API. */
export function toLocationPayload(values: LocationFormValues) {
  const t = (s: string) => s.trim();
  const n = (s: string) => (t(s) ? t(s) : null);
  return {
    name: t(values.name),
    companyId: values.companyId ?? null,
    phone: n(values.phone),
    contactPersonName: n(values.contactName),
    contactPersonPhone: n(values.contactPhone),
    addressLine1: n(values.addressLine1),
    addressLine2: n(values.addressLine2),
    country: n(values.country),
    stateProvince: n(values.stateProvince),
    city: n(values.city),
    postalCode: n(values.postalCode),
  };
}

export function locationToForm(loc: any): LocationFormValues {
  return {
    name: String(loc.name ?? ''),
    companyId: loc.companyId ?? null,
    phone: loc.phone ?? '',
    contactName: loc.contactPersonName ?? '',
    contactPhone: loc.contactPersonPhone ?? '',
    addressLine1: loc.addressLine1 ?? '',
    addressLine2: loc.addressLine2 ?? '',
    country: loc.country ?? '',
    stateProvince: loc.stateProvince ?? '',
    city: loc.city ?? '',
    postalCode: loc.postalCode ?? '',
  };
}
