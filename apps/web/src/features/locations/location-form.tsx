"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { Company } from "@/lib/types";
import { CompanySelect } from "./company-select";
import { GeoCascadeField, GeoValues } from "./geo-cascade-field";

export interface LocationFormValues {
  name: string;
  companyId: string | null;
  phone: string;
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  geo: GeoValues;
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
  geo: { country: "", stateProvince: "", city: "" },
  postalCode: "",
};

export interface LocationFormProps {
  initialValues?: LocationFormValues;
  initialCompany?: Pick<Company, "id" | "name" | "isActive"> | null;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  initialCompany = null,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateGeo(next: GeoValues) {
    setValues((v) => ({ ...v, geo: next }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Name" htmlFor="name" required>
            <input id="name" value={values.name} maxLength={100} onChange={(e) => update("name", e.target.value)} />
          </Field>

          <Field label="Company" htmlFor="company">
            <CompanySelect
              value={values.companyId}
              initialCompany={initialCompany ?? undefined}
              onChange={(id) => update("companyId", id)}
            />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Contact</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field label="Phone" htmlFor="phone">
            <input id="phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
          <Field label="Contact Person Name" htmlFor="contactName">
            <input id="contactName" value={values.contactName} onChange={(e) => update("contactName", e.target.value)} />
          </Field>
          <Field label="Contact Person's Phone" htmlFor="contactPhone">
            <input id="contactPhone" value={values.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <GeoCascadeField values={values.geo} onChange={updateGeo} />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
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
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
