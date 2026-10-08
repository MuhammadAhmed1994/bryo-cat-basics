'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banner, EmptyState, Field, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';
import { LocationRecord, LocationUpdate, getLocation, updateLocation } from '@/features/locations/location-api';

type EditableValues = {
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
};

function locationToValues(location: LocationRecord): EditableValues {
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

function isNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'status' in error && error.status === 404);
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [values, setValues] = useState<EditableValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    getLocation(params.id)
      .then((location) => {
        if (current) {
          setValues(locationToValues(location));
          setNotFound(false);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!current) return;
        setNotFound(isNotFound(error));
        setLoadError(isNotFound(error) ? null : 'Location details could not be loaded. Try again.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [params.id]);

  function update<K extends keyof EditableValues>(key: K, value: EditableValues[K]) {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function updateCountry(country: string) {
    setValues((current) => current ? { ...current, country, stateProvince: '', city: '' } : current);
    setErrors((current) => ({ ...current, country: '', stateProvince: '', city: '' }));
  }

  function updateState(stateProvince: string) {
    setValues((current) => current ? { ...current, stateProvince, city: '' } : current);
    setErrors((current) => ({ ...current, stateProvince: '', city: '' }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    else if (values.name.trim().length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    for (const key of ['phone', 'contactPersonPhone'] as const) {
      const phone = values[key].trim();
      if (phone && !/^\+?[0-9\s()-]{6,}$/.test(phone)) nextErrors[key] = 'Enter a valid phone number.';
    }
    if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) {
      nextErrors.country = 'Select a Country before entering State/Province or City.';
    }
    if (!values.stateProvince.trim() && values.city.trim()) {
      nextErrors.stateProvince = 'Select a State/Province before entering City.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: LocationUpdate = {
        name: values.name.trim(),
        companyId: values.companyId || null,
        phone: values.phone.trim() || null,
        contactPerson: values.contactPerson.trim() || null,
        contactPersonPhone: values.contactPersonPhone.trim() || null,
        addressLine1: values.addressLine1.trim() || null,
        addressLine2: values.addressLine2.trim() || null,
        country: values.country.trim() || null,
        stateProvince: values.stateProvince.trim() || null,
        city: values.city.trim() || null,
        postalCode: values.postalCode.trim() || null,
      };
      await updateLocation(params.id, payload);
      router.push(`/locations/${encodeURIComponent(params.id)}?success=${encodeURIComponent('Location updated successfully.')}`);
    } catch (error) {
      setFormError(
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Changes could not be saved. Review the highlighted fields and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;

  if (notFound || (!values && !loadError)) {
    return (
      <EmptyState
        title="Location not found."
        message="The Location may have been removed or is no longer available."
        action={<Link className="link" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (!values) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{loadError ?? 'Location details could not be loaded. Try again.'}</Banner>
        <Link className="link" href="/locations">Back to Locations</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-6 py-5">
        <Link href={`/locations/${encodeURIComponent(params.id)}`} aria-label="Back to Location Details" className="text-brand">
          <ChevronLeftIcon />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-ink">Edit Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Update the details for {values.name}.</p>
        </div>
      </header>

      {loadError && <Banner kind="error">{loadError}</Banner>}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate aria-label="Edit Location form">
        {formError && <Banner kind="error">{formError}</Banner>}
        <section className="card px-6 py-6" aria-labelledby="location-details-heading">
          <div className="mb-5">
            <h2 id="location-details-heading" className="text-lg font-semibold text-ink">Location details</h2>
            <p className="mt-1 text-sm text-ink-soft">Manage the location information and its company association.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Location name" htmlFor="location-name" required>
              <input id="location-name" value={values.name} maxLength={100} required aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'location-name-error' : undefined} onChange={(event) => update('name', event.target.value)} />
              {errors.name && <p id="location-name-error" className="error" role="alert">{errors.name}</p>}
            </Field>
            <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} />
            <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
              <input id="location-phone" type="tel" value={values.phone} aria-invalid={errors.phone ? true : undefined} onChange={(event) => update('phone', event.target.value)} />
            </Field>
            <Field label="Contact Person" htmlFor="contact-person">
              <input id="contact-person" value={values.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
            </Field>
            <Field label="Contact Person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
              <input id="contact-person-phone" type="tel" value={values.contactPersonPhone} aria-invalid={errors.contactPersonPhone ? true : undefined} onChange={(event) => update('contactPersonPhone', event.target.value)} />
            </Field>
          </div>
        </section>

        <section className="card px-6 py-6" aria-labelledby="location-address-heading">
          <div className="mb-5">
            <h2 id="location-address-heading" className="text-lg font-semibold text-ink">Address</h2>
            <p className="mt-1 text-sm text-ink-soft">Update this Location’s address details.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Address line 1" htmlFor="address-line-1"><input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} /></Field>
            <Field label="Address line 2" htmlFor="address-line-2"><input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} /></Field>
            <TypeaheadField id="location-country" label="Country" value={values.country} onChange={updateCountry} error={errors.country} options={['Australia', 'Canada', 'Ireland', 'New Zealand', 'United States']} />
            <TypeaheadField id="location-state-province" label="State/Province" value={values.stateProvince} onChange={updateState} disabled={!values.country.trim()} placeholder={!values.country.trim() ? 'Select a Country first' : 'Type a state or province'} error={errors.stateProvince} />
            <TypeaheadField id="location-city" label="City" value={values.city} onChange={(city) => update('city', city)} disabled={!values.stateProvince.trim()} placeholder={!values.stateProvince.trim() ? 'Select a State/Province first' : 'Type a city'} />
            <Field label="Postal code" htmlFor="postal-code"><input id="postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} /></Field>
          </div>
          <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">Select a Country before entering State/Province; select State/Province before City.</p>
        </section>

        <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-soft">Changes are not saved until you select Save Changes.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" className="btn btn--ghost" onClick={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
