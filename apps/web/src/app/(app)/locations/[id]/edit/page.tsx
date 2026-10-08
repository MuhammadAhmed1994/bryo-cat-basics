'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banner, EmptyState, Field, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { ApiError } from '@/lib/api';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';
import { getLocation, Location, UpdateLocationInput, updateLocation } from '@/features/locations/location-api';

interface LocationFormValues {
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

type LocationField = keyof LocationFormValues;
type FormErrors = Partial<Record<LocationField, string>>;

function toFormValues(location: Location): LocationFormValues {
  return {
    name: location.name ?? '',
    companyId: location.companyId ?? location.company?.id ?? null,
    phone: location.phone ?? '',
    contactPerson: location.contactPerson ?? '',
    contactPersonPhone: location.contactPersonPhone ?? '',
    addressLine1: location.addressLine1 ?? '',
    addressLine2: location.addressLine2 ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    postalCode: location.postalCode ?? '',
  };
}

function isValidPhone(value: string): boolean {
  const digits = Array.from(value).filter((character) => character >= '0' && character <= '9').length;
  return digits >= 7 && digits <= 15
    && Array.from(value).every((character) => (character >= '0' && character <= '9') || ' +().-'.includes(character));
}

function validate(values: LocationFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'Enter a location name.';
  else if (values.name.trim().length > 100) errors.name = 'Name cannot exceed 100 characters.';
  if (values.phone.trim() && !isValidPhone(values.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (values.contactPersonPhone.trim() && !isValidPhone(values.contactPersonPhone.trim())) {
    errors.contactPersonPhone = 'Enter a valid phone number.';
  }
  if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) {
    errors.country = 'Select a Country before State/Province or City.';
  }
  if (!values.stateProvince.trim() && values.city.trim()) {
    errors.stateProvince = 'Select a State/Province before City.';
  }
  return errors;
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function toUpdateInput(values: LocationFormValues): UpdateLocationInput {
  return {
    name: values.name.trim(),
    companyId: values.companyId,
    phone: nullable(values.phone),
    contactPerson: nullable(values.contactPerson),
    contactPersonPhone: nullable(values.contactPersonPhone),
    addressLine1: nullable(values.addressLine1),
    addressLine2: nullable(values.addressLine2),
    country: nullable(values.country),
    stateProvince: nullable(values.stateProvince),
    city: nullable(values.city),
    postalCode: nullable(values.postalCode),
  };
}

function serverErrorField(message: string): LocationField | undefined {
  const text = message.toLowerCase();
  if (text.includes('contact') && text.includes('phone')) return 'contactPersonPhone';
  if (text.includes('phone')) return 'phone';
  if (text.includes('country')) return 'country';
  if (text.includes('state') || text.includes('province')) return 'stateProvince';
  if (text.includes('city')) return 'city';
  if (text.includes('name') || text.includes('location')) return 'name';
  return undefined;
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [values, setValues] = useState<LocationFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getLocation(params.id)
      .then((record) => {
        if (!active) return;
        setLocation(record);
        setValues(toFormValues(record));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
        else setLoadError(error instanceof Error ? error.message : 'Location details could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  function update<K extends LocationField>(key: K, value: LocationFormValues[K]) {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function updateCountry(country: string) {
    setValues((current) => current ? { ...current, country, stateProvince: '', city: '' } : current);
    setErrors((current) => ({ ...current, country: undefined, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  function updateState(stateProvince: string) {
    setValues((current) => current ? { ...current, stateProvince, city: '' } : current);
    setErrors((current) => ({ ...current, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      await updateLocation(params.id, toUpdateInput(values));
      router.push(`/locations/${encodeURIComponent(params.id)}?success=${encodeURIComponent('Location updated successfully.')}`);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Changes could not be saved. Review the highlighted fields and try again.';
      const field = serverErrorField(message);
      if (field) setErrors((current) => ({ ...current, [field]: message }));
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;
  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="The Location may have been removed or the link may be incorrect."
        action={<Link className="btn btn--primary" href="/locations">Back to Locations</Link>}
      />
    );
  }
  if (loadError || !location || !values) {
    return <div className="flex flex-col gap-4"><Banner kind="error">{loadError ?? 'Location details could not be loaded.'}</Banner><Link href="/locations" className="text-brand">Back to Locations</Link></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-5 py-5 sm:px-7">
        <Link href={`/locations/${encodeURIComponent(params.id)}`} aria-label="Back to Location Details" className="text-brand"><ChevronLeftIcon /></Link>
        <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
      </header>
      <p className="text-sm text-ink-soft">Update the details for {location.name}.</p>
      <form onSubmit={handleSubmit} noValidate aria-label="Edit Location form" className="flex flex-col gap-4">
        {formError && <Banner kind="error">{formError}</Banner>}
        <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-details-title">
          <header className="mb-5">
            <h2 id="location-details-title" className="text-lg font-semibold text-ink">Location details</h2>
            <p className="mt-1 text-sm text-ink-soft">Manage the location information and its company association.</p>
          </header>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            <Field label="Location name" htmlFor="location-name" error={errors.name} required>
              <input id="location-name" name="name" value={values.name} maxLength={100} required aria-invalid={Boolean(errors.name)} onChange={(event) => update('name', event.target.value)} />
            </Field>
            <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} />
            <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
              <input id="location-phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => update('phone', event.target.value)} />
            </Field>
            <Field label="Contact person" htmlFor="contact-person">
              <input id="contact-person" value={values.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
            </Field>
            <Field label="Contact person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
              <input id="contact-person-phone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} onChange={(event) => update('contactPersonPhone', event.target.value)} />
            </Field>
          </div>
        </section>
        <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-address-title">
          <header className="mb-5">
            <h2 id="location-address-title" className="text-lg font-semibold text-ink">Address</h2>
            <p className="mt-1 text-sm text-ink-soft">Enter the location’s mailing address.</p>
          </header>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3"><Field label="Address line 1" htmlFor="address-line-1"><input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} /></Field></div>
            <div className="sm:col-span-2 lg:col-span-3"><Field label="Address line 2" htmlFor="address-line-2"><input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} /></Field></div>
            <TypeaheadField id="location-country" label="Country" value={values.country} error={errors.country} onChange={updateCountry} />
            <TypeaheadField id="location-state-province" label="State/Province" value={values.stateProvince} disabled={!values.country.trim()} error={errors.stateProvince} onChange={updateState} />
            <TypeaheadField id="location-city" label="City" value={values.city} disabled={!values.stateProvince.trim()} error={errors.city} onChange={(city) => update('city', city)} />
            <Field label="Postal code" htmlFor="postal-code"><input id="postal-code" value={values.postalCode} maxLength={20} onChange={(event) => update('postalCode', event.target.value)} /></Field>
          </div>
          <p className="mt-5 rounded-lg bg-canvas px-3 py-2.5 text-xs leading-5 text-ink-soft">Select a Country before entering State/Province; select State/Province before City.</p>
        </section>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-soft">Changes are not saved until you select Save Changes.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn--ghost" onClick={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
