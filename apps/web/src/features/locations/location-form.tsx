"use client";

import { useEffect, useState } from 'react';
import { Banner, Field } from '@/components/ui';
import { Company } from '@/lib/types';
import { CompanySelect } from './company-select';
import { GeoCascadeField, GeoValue } from './geo-cascade-field';

export interface LocationFormValues {
  name: string;
  companyId: string | null;
  phone: string;
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  geo: GeoValue;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
  name: '',
  companyId: null,
  phone: '',
  contactName: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  geo: { country: '', stateProvince: '', city: '' },
};

export interface StoredCompanyInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export function locationToForm(
  stored: {
    name: string;
    companyId: string | null;
    phone: string | null;
    contactPersonName: string | null;
    contactPersonPhone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    country: string | null;
    stateProvince: string | null;
    city: string | null;
  },
): LocationFormValues {
  return {
    name: stored.name,
    companyId: stored.companyId,
    phone: stored.phone ?? '',
    contactName: stored.contactPersonName ?? '',
    contactPhone: stored.contactPersonPhone ?? '',
    addressLine1: stored.addressLine1 ?? '',
    addressLine2: stored.addressLine2 ?? '',
    postalCode: stored.postalCode ?? '',
    geo: {
      country: stored.country ?? '',
      stateProvince: stored.stateProvince ?? '',
      city: stored.city ?? '',
    },
  };
}

interface LocationFormProps {
  initialValues?: LocationFormValues;
  initialCompany?: StoredCompanyInfo | null;
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  /** For edit screens we may require a change before enabling submit. */
  requireChange?: boolean;
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  initialCompany = null,
  submitLabel,
  submitting = false,
  formError = null,
  requireChange = false,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [dirty, setDirty] = useState(false);

  // Sync when prefill arrives (edit page).
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  }

  function updateGeo(next: Partial<GeoValue>) {
    setValues((v) => ({ ...v, geo: { ...v.geo, ...next } }));
    setDirty(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  const disabled = submitting || (requireChange && !dirty);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Name" htmlFor="loc-name" required>
            <input
              id="loc-name"
              value={values.name}
              maxLength={100}
              onChange={(e) => update('name', e.target.value)}
            />
          </Field>

          <CompanySelect
            value={values.companyId}
            initialCompany={initialCompany ?? undefined}
            onChange={(id) => update('companyId', id)}
          />
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Contact</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Phone" htmlFor="loc-phone">
            <input
              id="loc-phone"
              value={values.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </Field>

          <Field label="Contact Person Name" htmlFor="loc-contact-name">
            <input
              id="loc-contact-name"
              value={values.contactName}
              onChange={(e) => update('contactName', e.target.value)}
            />
          </Field>

          <Field label="Contact Person Phone" htmlFor="loc-contact-phone">
            <input
              id="loc-contact-phone"
              value={values.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <GeoCascadeField value={values.geo} onChange={updateGeo} idPrefix="loc-geo" />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Address Line 1" htmlFor="loc-line1">
            <input
              id="loc-line1"
              value={values.addressLine1}
              onChange={(e) => update('addressLine1', e.target.value)}
            />
          </Field>

          <Field label="Address Line 2" htmlFor="loc-line2">
            <input
              id="loc-line2"
              value={values.addressLine2}
              onChange={(e) => update('addressLine2', e.target.value)}
            />
          </Field>

          <Field label="Postal Code" htmlFor="loc-postal">
            <input
              id="loc-postal"
              value={values.postalCode}
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
