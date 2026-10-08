'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banner, EmptyState, Field, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';
import { ApiError } from '@/lib/api';
import { Location, LocationInput, getLocation, updateLocation } from '@/features/locations/location-api';
import { CompanySingleSelect } from '@/features/locations/company-single-select';
import { TypeaheadField } from '@/features/locations/typeahead-field';

interface LocationValues {
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

type FieldKey = keyof LocationValues;
type FieldErrors = Partial<Record<FieldKey, string>>;

function locationToValues(location: Location): LocationValues {
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

function locationPayload(values: LocationValues): LocationInput {
  return {
    name: values.name.trim(),
    companyId: values.companyId,
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
}

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,30}$/;

function mapError(message: string): FieldErrors {
  const lower = message.toLowerCase();
  if (lower.includes('phone')) {
    return { [lower.includes('contact') ? 'contactPersonPhone' : 'phone']: message };
  }
  if (lower.includes('country')) return { country: message };
  if (lower.includes('state')) return { stateProvince: message };
  if (lower.includes('city') || lower.includes('geograph')) return { city: message };
  if (lower.includes('name') || lower.includes('location')) return { name: message };
  return {};
}

/** Edit an existing Location, keeping the controlled form values on API validation errors. */
export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [values, setValues] = useState<LocationValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLocation = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    getLocation(params.id)
      .then((record) => {
        if (cancelled) return;
        setLocation(record);
        setValues(locationToValues(record));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Location could not be loaded. Try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params.id]);

  useEffect(() => loadLocation(), [loadLocation]);

  function update<K extends FieldKey>(key: K, value: LocationValues[K]) {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function changeCountry(country: string) {
    setValues((current) => current ? { ...current, country, stateProvince: '', city: '' } : current);
    setErrors((current) => ({ ...current, country: undefined, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  function changeState(stateProvince: string) {
    setValues((current) => current ? { ...current, stateProvince, city: '' } : current);
    setErrors((current) => ({ ...current, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;
    const nextErrors: FieldErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    else if (values.name.length > 100) nextErrors.name = 'Name cannot exceed 100 characters.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) nextErrors.phone = 'Enter a valid phone number.';
    if (values.contactPersonPhone.trim() && !PHONE_PATTERN.test(values.contactPersonPhone.trim())) {
      nextErrors.contactPersonPhone = 'Enter a valid phone number.';
    }
    if (!values.country.trim() && (values.stateProvince.trim() || values.city.trim())) {
      nextErrors.country = 'Select a Country before entering State/Province or City.';
    } else if (!values.stateProvince.trim() && values.city.trim()) {
      nextErrors.stateProvince = 'Select State/Province before entering City.';
    }
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const result = await updateLocation(params.id, locationPayload(values));
      const message = result.message || 'Location updated successfully.';
      router.push(`/locations/${params.id}?success=${encodeURIComponent(message)}`);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Changes could not be saved. Review the highlighted fields and try again.';
      setErrors(mapError(message));
      setFormError(message || 'Changes could not be saved. Review the highlighted fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;

  if (notFound) {
    return (
      <EmptyState
        title="Location not found."
        message="This Location may have been removed or is no longer available."
        action={<Link className="btn btn--primary" href="/locations">Back to Locations</Link>}
      />
    );
  }

  if (loadError || !location || !values) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{loadError ?? 'Location could not be loaded. Try again.'}</Banner>
        <div className="flex gap-3">
          <button className="btn btn--primary" type="button" onClick={() => loadLocation()}>Retry</button>
          <Link className="btn btn--ghost" href="/locations">Back to Locations</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button type="button" aria-label="Back to Location Details" className="text-brand" onClick={() => router.push(`/locations/${params.id}`)}>
          <ChevronLeftIcon />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-brand">Edit Location</h1>
          <p className="hint">Update the details for {location.name}.</p>
        </div>
      </header>

      <form className="flex flex-col gap-4" aria-label="Edit Location form" onSubmit={submit} noValidate>
        {formError && <Banner kind="error">{formError}</Banner>}
        <section className="card px-7 py-6" aria-labelledby="location-details-heading">
          <div className="mb-5">
            <h2 id="location-details-heading" className="text-base font-semibold text-ink">Location details</h2>
            <p className="hint">Manage the location information and its company association.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Location name" htmlFor="location-name" error={errors.name} hint="Name is required (100 characters maximum)." required>
              <input id="location-name" value={values.name} maxLength={100} required aria-invalid={Boolean(errors.name)} onChange={(event) => update('name', event.target.value)} />
            </Field>
            <CompanySingleSelect value={values.companyId} onChange={(companyId) => update('companyId', companyId)} error={errors.companyId} />
            <Field label="Location phone" htmlFor="location-phone" error={errors.phone}>
              <input id="location-phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => update('phone', event.target.value)} />
            </Field>
            <Field label="Contact person" htmlFor="contact-person" error={errors.contactPerson}>
              <input id="contact-person" value={values.contactPerson} aria-invalid={Boolean(errors.contactPerson)} onChange={(event) => update('contactPerson', event.target.value)} />
            </Field>
            <Field label="Contact person phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
              <input id="contact-person-phone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} onChange={(event) => update('contactPersonPhone', event.target.value)} />
            </Field>
          </div>
        </section>

        <section className="card px-7 py-6" aria-labelledby="location-address-heading">
          <div className="mb-5">
            <h2 id="location-address-heading" className="text-base font-semibold text-ink">Address</h2>
            <p className="hint">Enter the location’s mailing address.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Address line 1" htmlFor="address-line-1">
              <input id="address-line-1" value={values.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} />
            </Field>
            <Field label="Address line 2" htmlFor="address-line-2">
              <input id="address-line-2" value={values.addressLine2} onChange={(event) => update('addressLine2', event.target.value)} />
            </Field>
            <TypeaheadField id="country" label="Country" value={values.country} options={['Australia', 'Canada', 'Ireland', 'New Zealand', 'United States']} onChange={changeCountry} error={errors.country} />
            <TypeaheadField id="state-province" label="State/Province" value={values.stateProvince} options={['California', 'New South Wales', 'Ontario', 'Queensland']} onChange={changeState} disabled={!values.country.trim()} disabledHint="Select a Country first." error={errors.stateProvince} />
            <TypeaheadField id="city" label="City" value={values.city} options={['Oakland', 'Dubbo', 'Toronto', 'Brisbane']} onChange={(city) => update('city', city)} disabled={!values.stateProvince.trim()} disabledHint="Select State/Province first." error={errors.city} />
            <Field label="Postal code" htmlFor="postal-code" error={errors.postalCode}>
              <input id="postal-code" value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} />
            </Field>
          </div>
          <p className="mt-4 rounded-md bg-canvas p-3 text-xs text-ink-soft">Select a Country before entering State/Province; select State/Province before City.</p>
        </section>

        <p className="hint">Changes are not saved until you select Save Changes.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn--ghost" onClick={() => router.push(`/locations/${params.id}`)}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving Changes…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
