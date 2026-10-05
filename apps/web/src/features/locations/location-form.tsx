"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { CompanySelect, CompanyOption } from "./company-select";
import { GeoCascadeField, GeoValue } from "./geo-cascade-field";

export interface LocationFormValues {
  name: string;
  companyId: string | null;
  geo: GeoValue;
}

export const EMPTY_LOCATION_FORM: LocationFormValues = {
  name: "",
  companyId: null,
  geo: { country: "", stateProvince: "", city: "" },
};

interface LocationFormProps {
  initialValues?: LocationFormValues;
  initialCompanyOption?: CompanyOption | null;
  submitLabel?: string;
}

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  initialCompanyOption = null,
  submitLabel = "Save Location",
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <section className="card px-7 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </Field>

          <CompanySelect
            value={values.companyId}
            onChange={(id) => setValues((v) => ({ ...v, companyId: id }))}
            initialOption={initialCompanyOption ?? undefined}
          />
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <GeoCascadeField value={values.geo} onChange={(geo) => setValues((v) => ({ ...v, geo }))} />
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn--ghost">
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
