'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';
import { Location, getLocation, updateLocation } from '@/features/locations/location-api';
import { ApiError } from '@/lib/api';
import { EMPTY_LOCATION_FORM, LocationFormErrors, LocationFormValues, toLocationPayload } from '@/features/locations/location-form';

const emptyForm: LocationFormValues = { ...EMPTY_LOCATION_FORM };

function locationToForm(location: Location): LocationFormValues {
  return {
    name: location.name ?? '',
    companyId: location.companyId ?? null,
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

/** Edit an existing Location and preserve the form if the API rejects a change. */
export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [values, setValues] = useState<LocationFormValues>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<LocationFormErrors>({});

  useEffect(() => {
    let current = true;
    getLocation(params.id)
      .then((location) => {
        if (current) setValues(locationToForm(location));
      })
      .catch((error: unknown) => {
        if (!current) return;
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
        else setLoadError(error instanceof ApiError ? error.message : 'Location details could not be loaded. Try again.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [params.id]);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'country' ? { stateProvince: '', city: '' } : {}),
      ...(key === 'stateProvince' ? { city: '' } : {}),
    }));
    setServerErrors((previous) => ({ ...previous, [key]: null }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setServerErrors({});
    const errors: LocationFormErrors = {};
    if (!values.name.trim()) errors.name = 'Enter a location name.';
    else if (values.name.length > 100) errors.name = 'Location name must be 100 characters or fewer.';
    const phonePattern = /^\+?[0-9\s()-]{6,}$/;
    if (values.phone.trim() && !phonePattern.test(values.phone.trim())) errors.phone = 'Enter a valid phone number.';
    if (values.contactPersonPhone.trim() && !phonePattern.test(values.contactPersonPhone.trim())) errors.contactPersonPhone = 'Enter a valid phone number.';
    if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) errors.country = 'Choose a country before entering State/Province or City.';
    if (!values.stateProvince.trim() && values.city.trim()) errors.stateProvince = 'Choose a State/Province before entering a City.';
    setServerErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setFormError('Changes could not be saved. Review the highlighted fields and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await updateLocation(params.id, toLocationPayload(values));
      router.push(`/locations/${encodeURIComponent(params.id)}?success=${encodeURIComponent('Location updated successfully.')}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Changes could not be saved. Review the highlighted fields and try again.';
      const normalized = message.toLowerCase();
      const fieldErrors: LocationFormErrors = {};
      if (/name|duplicate|already exists|unique/.test(normalized)) fieldErrors.name = message;
      if (/phone/.test(normalized)) {
        if (/contact/.test(normalized)) fieldErrors.contactPersonPhone = message;
        else fieldErrors.phone = message;
      }
      if (/country|state|province|city|geograph/.test(normalized)) {
        fieldErrors.country = message;
        fieldErrors.stateProvince = message;
        fieldErrors.city = message;
      }
      setServerErrors(fieldErrors);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;
  if (notFound) return <EmptyState title="Location not found." message="This Location may have been removed or is no longer available." action={<Link className="text-brand underline" href="/locations">Back to Locations</Link>} />;
  if (loadError) return <div className="flex flex-col gap-4"><Banner kind="error">{loadError}</Banner><Link className="text-brand underline" href="/locations">Back to Locations</Link></div>;

  const fieldError = (field: keyof LocationFormValues) => serverErrors[field];

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <Link href={`/locations/${encodeURIComponent(params.id)}`} aria-label="Back to Location Details" className="text-brand"><ChevronLeftIcon /></Link>
        <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
      </header>
      <p className="text-sm text-ink-soft">Update the details for {values.name}.</p>
      <form className="flex flex-col gap-4" aria-label="Edit Location form" onSubmit={handleSubmit} noValidate>
        {formError && <Banner kind="error">{formError}</Banner>}
        <section className="card px-7 py-6" aria-labelledby="edit-location-details-heading">
          <h2 id="edit-location-details-heading" className="mb-4 text-base font-semibold text-ink">Location details</h2>
          <p className="mb-5 text-sm text-ink-soft">Manage the location information and its company association.</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="field">
              <label htmlFor="location-name">Location name</label>
              <input id="location-name" value={values.name} maxLength={100} aria-invalid={Boolean(fieldError('name'))} aria-describedby={fieldError('name') ? 'location-name-error' : undefined} onChange={(event) => update('name', event.target.value)} />
              {fieldError('name') && <p id="location-name-error" className="error" role="alert">{fieldError('name')}</p>}
              <p className="hint">Name is required (100 characters maximum).</p>
            </div>
            <CompanySingleSelect value={values.companyId} onChange={(value) => update('companyId', value)} />
            <div className="field">
              <label htmlFor="location-phone">Location phone</label>
              <input id="location-phone" type="tel" value={values.phone} aria-invalid={Boolean(fieldError('phone'))} aria-describedby={fieldError('phone') ? 'location-phone-error' : undefined} onChange={(event) => update('phone', event.target.value)} />
              {fieldError('phone') && <p id="location-phone-error" className="error" role="alert">{fieldError('phone')}</p>}
            </div>
            <div className="field"><label htmlFor="contact-person">Contact person</label><input id="contact-person" value={values.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} /></div>
            <div className="field">
              <label htmlFor="contact-person-phone">Contact person phone</label>
              <input id="contact-person-phone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(fieldError('contactPersonPhone'))} aria-describedby={fieldError('contactPersonPhone') ? 'contact-person-phone-error' : undefined} onChange={(event) => update('contactPersonPhone', event.target.value)} />
              {fieldError('contactPersonPhone') && <p id="contact-person-phone-error" className="error" role="alert">{fieldError('contactPersonPhone')}</p>}
            </div>
          </div>
        </section>
        <section className="card px-7 py-6" aria-labelledby="edit-location-address-heading">
          <h2 id="edit-location-address-heading" className="mb-4 text-base font-semibold text-ink">Address</h2>
          <p className="mb-5 text-sm text-ink-soft">Enter the location’s mailing address.</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="field md:col-span-2 xl:col-span-3"><label htmlFor="address-line-1">Address line 1</label><input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} /></div>
            <div className="field md:col-span-2 xl:col-span-3"><label htmlFor="address-line-2">Address line 2</label><input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} /></div>
            <TypeaheadField id="country" label="Country" value={values.country} onChange={(value) => update('country', value)} error={fieldError('country')} hint="Type a country name; entered text is saved." />
            <TypeaheadField id="state-province" label="State/Province" value={values.stateProvince} onChange={(value) => update('stateProvince', value)} disabled={!values.country.trim()} placeholder={values.country.trim() ? 'Enter a state or province' : 'Select a country first'} error={fieldError('stateProvince')} hint="Type a state or province; entered text is saved." />
            <TypeaheadField id="city" label="City" value={values.city} onChange={(value) => update('city', value)} disabled={!values.stateProvince.trim()} placeholder={values.stateProvince.trim() ? 'Enter a city' : 'Select a state or province first'} error={fieldError('city')} hint="Type a city; entered text is saved." />
            <div className="field"><label htmlFor="postal-code">Postal code</label><input id="postal-code" value={values.postalCode} maxLength={20} onChange={(event) => update('postalCode', event.target.value)} /></div>
          </div>
          <p className="hint mt-5">Select a Country before entering State/Province; select State/Province before City.</p>
        </section>
        <p className="text-sm text-ink-soft">Changes are not saved until you select Save Changes.</p>
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button type="button" className="btn btn--ghost" onClick={() => router.push(`/locations/${encodeURIComponent(params.id)}`)}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
