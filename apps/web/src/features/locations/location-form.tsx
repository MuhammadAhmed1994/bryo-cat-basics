"use client";

import { useEffect, useState } from "react";
import { Banner, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
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

export interface SelectedCompanyOption {
  id: string;
  name: string;
  isActive: boolean;
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

function validateLocationName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Enter a location name";
  if (name.length > 100) return "Name cannot exceed 100 characters.";
  return null;
}

function validateOptionalPhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return null;
  return /^\+?[0-9\s()-]{6,}$/.test(phone) ? null : "Enter a valid phone number.";
}

function isClean(errors: Record<string, string | null>): boolean {
  return Object.values(errors).every((e) => !e);
}

export interface LocationFormProps {
  initialValues?: LocationFormValues;
  /**
   * Optional: when editing, the stored company may be inactive —
   * pass it here so CompanySelect can show it as a one-off option.
   */
  initialCompanyOption?: SelectedCompanyOption | null;
  submitLabel: string;
  submitting?: boolean;
  formError?: string | null;
  onSubmit: (values: LocationFormValues) => void;
  onCancel: () => void;
}

export function LocationForm({
  initialValues = EMPTY_LOCATION_FORM,
  initialCompanyOption = null,
  submitLabel,
  submitting = false,
  formError = null,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Keep internal state in sync once prefill arrives on Edit.
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string | null> = {
      name: validateLocationName(values.name),
      phone: validateOptionalPhone(values.phone),
      contactPhone: validateOptionalPhone(values.contactPhone),
    };
    setErrors(nextErrors);
    if (!isClean(nextErrors)) return;
    onSubmit(values);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Basic Information</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name} required>
            <input
              id="name"
              value={values.name}
              maxLength={100}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>

          <Field label="Company" htmlFor="company">
            <CompanySelect
              id="company"
              value={values.companyId}
              selectedLabel={initialCompanyOption?.name}
              selectedIsActive={initialCompanyOption?.isActive}
              onChange={(id) => update("companyId", id)}
            />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Contact</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <input
              id="phone"
              value={values.phone}
              placeholder="+61 400 000 000"
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>

          <Field label="Contact Person Name" htmlFor="contactName">
            <input
              id="contactName"
              value={values.contactName}
              onChange={(e) => update("contactName", e.target.value)}
            />
          </Field>

          <Field label="Contact Person's Phone" htmlFor="contactPhone" error={errors.contactPhone}>
            <input
              id="contactPhone"
              value={values.contactPhone}
              placeholder="+61 400 000 000"
              onChange={(e) => update("contactPhone", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card px-7 py-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Address</h2>
        <GeoCascadeField
          country={values.country}
          stateProvince={values.stateProvince}
          city={values.city}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
            <input
              id="postalCode"
              value={values.postalCode}
              maxLength={20}
              onChange={(e) => update("postalCode", e.target.value)}
            />
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

/** Blank strings become nulls so the API stores nulls for missing values. */
export function toLocationPayload(values: LocationFormValues) {
  return {
    name: values.name.trim(),
    companyId: values.companyId ?? null,
    phone: values.phone.trim() || null,
    contactPersonName: values.contactName.trim() || null,
    contactPersonPhone: values.contactPhone.trim() || null,
    addressLine1: values.addressLine1.trim() || null,
    addressLine2: values.addressLine2.trim() || null,
    country: values.country.trim() || null,
    stateProvince: values.stateProvince.trim() || null,
    city: values.city.trim() || null,
    postalCode: values.postalCode.trim() || null,
  };
}

export interface LocationDTO {
  id: string;
  name: string;
  companyId: string | null;
  phone: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  postalCode: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export function locationToForm(loc: LocationDTO): LocationFormValues {
  return {
    name: loc.name,
    companyId: loc.companyId ?? null,
    phone: loc.phone ?? "",
    contactName: loc.contactPersonName ?? "",
    contactPhone: loc.contactPersonPhone ?? "",
    addressLine1: loc.addressLine1 ?? "",
    addressLine2: loc.addressLine2 ?? "",
    country: loc.country ?? "",
    stateProvince: loc.stateProvince ?? "",
    city: loc.city ?? "",
    postalCode: loc.postalCode ?? "",
  };
}
