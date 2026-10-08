'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banner, EmptyState, Field, Spinner } from '@/components/ui';
import { ApiError } from '@/lib/api';
import {
  Location,
  LocationInput,
  getLocation,
  updateLocation,
} from '@/features/locations/location-api';
import {
  LocationFormValues,
  toLocationPayload,
} from '@/features/locations/location-form';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';

const EMPTY_VALUES: LocationFormValues = {
  name: '', companyId: null, phone: '', contactPerson: '', contactPersonPhone: '',
  addressLine1: '', addressLine2: '', country: '', stateProvince: '', city: '', postalCode: '',
};

function locationToForm(location: Location): LocationFormValues {
  return {
    name: location.name,
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

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [values, setValues] = useState<LocationFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getLocation(params.id)
      .then((record) => {
        if (!active) return;
        setLocation(record);
        setValues(locationToForm(record));
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
        else setPageError(cause instanceof ApiError ? cause.message : 'Location details could not be loaded. Try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function changeCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
    setErrors((current) => ({ ...current, country: '', stateProvince: '', city: '' }));
  }

  function changeState(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
    setErrors((current) => ({ ...current, stateProvince: '', city: '' }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation: Record<string, string> = {};
    if (!values.name.trim()) validation.name = 'Enter a location name.';
    if (values.name.trim().length > 100) validation.name = 'Name cannot exceed 100 characters.';
    if (values.phone.trim() && !/^\+?[0-9\s()-]{6,}$/.test(values.phone.trim())) validation.phone = 'Enter a valid phone number.';
    if (values.contactPersonPhone.trim() && !/^\+?[0-9\s()-]{6,}$/.test(values.contactPersonPhone.trim())) validation.contactPersonPhone = 'Enter a valid phone number.';
    if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) validation.country = 'Select a country before entering a state or city.';
    if (!values.stateProvince.trim() && values.city.trim()) validation.stateProvince = 'Select a state or province before entering a city.';
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    setPageError(null);
    try {
      const input: LocationInput = toLocationPayload(values);
      await updateLocation(params.id, input);
      const message = 'Location updated successfully.';
      sessionStorage.setItem('location-success', message);
      router.push(`/locations/${encodeURIComponent(params.id)}?success=${encodeURIComponent(message)}`);
    } catch (cause) {
      setPageError(cause instanceof ApiError
        ? cause.message
        : 'Changes could not be saved. Review the highlighted fields and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;
  if (notFound) {
    return <EmptyState title="Location not found." message="This Location may have been removed or may no longer be available." action={<Link className="btn btn--primary" href="/locations">Back to Locations</Link>} />;
  }
  if (pageError && !location) return <Banner kind="error">{pageError}</Banner>;
  if (!location) return null;

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-3 px-5 py-5 sm:px-7">
        <button type="button" aria-label="Back to Location Details" className="text-brand" onClick={() => router.push(`/locations/${params.id}`)}>‹</button>
        <div>
          <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Update the details for {location.name}.</p>
        </div>
      </header>
      <form className="flex flex-col gap-4" aria-label="Edit Location form" onSubmit={handleSubmit} noValidate>
        {pageError && <Banner kind="error">{pageError}</Banner>}
        <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-details-heading">
          <h2 id="location-details-heading" className="mb-5 text-lg font-semibold text-ink">Location details</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Location name" htmlFor="location-name" error={errors.name} required>
              <input id="location-name" name="name" value={values.name} maxLength={100} required aria-invalid={Boolean(errors.name)} onChange={(event) => update('name', event.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} id="location-company" disabled={submitting} />
            </div>
            <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
              <input id="location-phone" name="phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => update('phone', event.target.value)} />
            </Field>
            <Field label="Contact Person" htmlFor="contact-person">
              <input id="contact-person" name="contactPerson" value={values.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
            </Field>
            <Field label="Contact Person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
              <input id="contact-person-phone" name="contactPersonPhone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} onChange={(event) => update('contactPersonPhone', event.target.value)} />
            </Field>
          </div>
        </section>
        <section className="card px-5 py-6 sm:px-7" aria-labelledby="location-address-heading">
          <h2 id="location-address-heading" className="mb-5 text-lg font-semibold text-ink">Address</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3"><Field label="Address line 1" htmlFor="address-line-1"><input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} /></Field></div>
            <div className="md:col-span-2 xl:col-span-3"><Field label="Address line 2" htmlFor="address-line-2"><input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} /></Field></div>
            <TypeaheadField id="location-country" label="Country" value={values.country} onChange={changeCountry} error={errors.country} />
            <TypeaheadField id="location-state" label="State/Province" value={values.stateProvince} onChange={changeState} disabled={!values.country.trim()} placeholder={!values.country.trim() ? 'Select a country first' : undefined} error={errors.stateProvince} />
            <TypeaheadField id="location-city" label="City" value={values.city} onChange={(city) => update('city', city)} disabled={!values.stateProvince.trim()} placeholder={!values.stateProvince.trim() ? 'Select a state or province first' : undefined} error={errors.city} />
            <Field label="Postal code" htmlFor="postal-code"><input id="postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} /></Field>
          </div>
          <p className="mt-5 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">Select a Country before entering State/Province; select State/Province before City.</p>
        </section>
        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-soft">Changes are not saved until you select Save Changes.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" className="btn btn--ghost" onClick={() => router.push(`/locations/${params.id}`)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
