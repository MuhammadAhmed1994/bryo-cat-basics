"use client";

import { useState } from "react";
import { Banner, Field } from "@/components/ui";
import { CompanySelect, CompanyOption } from "./company-select";
import { GeoCascadeField, GeoCascadeValue } from "./geo-cascade-field";

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
  name: "",
  companyId: null,
  phone: "",
  contactName: "",
  contactPhone: "",
  addressLine1: "",
  addressLine2: "",
  country: "",
  stateProvince: "",
  city: "",
  postalCode: "",
};

interface LocationFormProps {
  initialValues?: LocationFormValues;
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  /** When editing, keep the primary action disabled until prefill completes (AC-10). */
  prefillComplete?: boolean;
  /** Edit screens may require an actual change before enabling Save. */
  requireChange?: boolean;
  companies?: CompanyOption[];
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  submitLabel,
  submitting = false,
  formError = null,
  prefillComplete = true,
  requireChange = false,
  companies = [],
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function updateGeo(next: GeoCascadeValue) {
    setValues((current) => ({ ...current, country: next.country, stateProvince: next.state, city: next.city }));
    setDirty(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  const disabled = submitting || !prefillComplete || (requireChange && !dirty);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Name" htmlFor="name" required>
            <input id="name" value={values.name} maxLength={100} onChange={(e) => update("name", e.target.value)} />
          </Field>

          <CompanySelect
            value={values.companyId}
            onChange={(val) => update("companyId", val)}
            options={companies}
          />
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Contact</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Phone" htmlFor="phone">
            <input id="phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Contact Person Name" htmlFor="contactName">
            <input id="contactName" value={values.contactName} onChange={(e) => update("contactName", e.target.value)} />
          </Field>
          <Field label="Contact Person Phone" htmlFor="contactPhone">
            <input id="contactPhone" value={values.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          </Field>
        </div>
      </section>

      <GeoCascadeField
        value={{ country: values.country, state: values.stateProvince, city: values.city }}
        onChange={updateGeo}
      />

      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Address Line 1" htmlFor="addressLine1">
            <input
              id="addressLine1"
              value={values.addressLine1}
              onChange={(e) => update("addressLine1", e.target.value)}
            />
          </Field>
          <Field label="Address Line 2" htmlFor="addressLine2">
            <input
              id="addressLine2"
              value={values.addressLine2}
              onChange={(e) => update("addressLine2", e.target.value)}
            />
          </Field>
          <Field label="Postal Code" htmlFor="postalCode">
            <input id="postalCode" value={values.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={disabled}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
