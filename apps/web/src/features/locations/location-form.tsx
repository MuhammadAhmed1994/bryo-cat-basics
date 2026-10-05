"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, Banner } from "@/components/ui";
import { Company } from "@/lib/types";
import { CompanySelect } from "./company-select";
import { GeoCascadeField } from "./geo-cascade-field";

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

export interface LocationFormProps {
  submitLabel: string;
  submitting?: boolean;
  loading?: boolean; // When true (edit prefill), keep primary action disabled
  formError?: string | null;
  /** Values to seed the form with (Edit) */
  initialValues?: Partial<LocationFormValues> | null;
  /** Preselected company details for Edit, so the select can show its label. */
  initialCompany?: { id: string; name: string; isActive: boolean } | null;
  onSubmit?: (values: LocationFormValues) => void;
  onCancel?: () => void;
}

const EMPTY: LocationFormValues = {
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

export function LocationForm({
  submitLabel,
  submitting = false,
  loading = false,
  formError,
  initialValues,
  initialCompany,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const seeded = useMemo<LocationFormValues>(() => ({ ...EMPTY, ...(initialValues ?? {}) }), [initialValues]);
  const [values, setValues] = useState<LocationFormValues>(seeded);
  const [companyOption, setCompanyOption] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(initialCompany ?? null);

  useEffect(() => {
    setValues(seeded);
  }, [seeded]);

  useEffect(() => {
    setCompanyOption(initialCompany ?? null);
  }, [initialCompany]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit?.(values);
  }

  return (
    <form className="card flex flex-col gap-6 px-7 py-6" onSubmit={handleSubmit}>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Name" htmlFor="name" required>
          <input
            id="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
        </Field>

        <Field label="Company" htmlFor="company">
          <CompanySelect
            id="company"
            value={values.companyId}
            onChange={(id, option) => {
              setValues((v) => ({ ...v, companyId: id }));
              setCompanyOption(option);
            }}
            initialOption={companyOption}
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          />
        </Field>
        <Field label="Contact Person Name" htmlFor="contactName">
          <input
            id="contactName"
            value={values.contactName}
            onChange={(e) => setValues((v) => ({ ...v, contactName: e.target.value }))}
          />
        </Field>
        <Field label="Contact Person Phone" htmlFor="contactPhone">
          <input
            id="contactPhone"
            value={values.contactPhone}
            onChange={(e) => setValues((v) => ({ ...v, contactPhone: e.target.value }))}
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <GeoCascadeField
          country={values.country}
          stateProvince={values.stateProvince}
          city={values.city}
          onCountryChange={(country) =>
            setValues((v) => ({ ...v, country, stateProvince: "", city: "" }))
          }
          onStateProvinceChange={(stateProvince) =>
            setValues((v) => ({ ...v, stateProvince, city: "" }))
          }
          onCityChange={(city) => setValues((v) => ({ ...v, city }))}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Address Line 1" htmlFor="addressLine1">
            <input
              id="addressLine1"
              value={values.addressLine1}
              onChange={(e) => setValues((v) => ({ ...v, addressLine1: e.target.value }))}
            />
          </Field>
          <Field label="Address Line 2" htmlFor="addressLine2">
            <input
              id="addressLine2"
              value={values.addressLine2}
              onChange={(e) => setValues((v) => ({ ...v, addressLine2: e.target.value }))}
            />
          </Field>
          <Field label="Postal Code" htmlFor="postalCode">
            <input
              id="postalCode"
              value={values.postalCode}
              onChange={(e) => setValues((v) => ({ ...v, postalCode: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      <div className="mt-2 flex items-center justify-end gap-3">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting || loading}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
