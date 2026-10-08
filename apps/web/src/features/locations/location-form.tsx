'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Banner, Field, Spinner } from '@/components/ui';
import {
  createLocation,
  getActiveCompanies,
  getLocation,
  LocationApiError,
  updateLocation,
} from './location-api';
import { Location, LocationCompany, LocationPayload, LocationValues } from './location-types';

const EMPTY_VALUES: LocationValues = {
  name: '',
  phone: '',
  contactPersonPhone: '',
  country: '',
  stateProvince: '',
  city: '',
  companyId: null,
};

export function locationToForm(location: Location): LocationValues {
  return {
    name: location.name ?? '',
    phone: location.phone ?? '',
    contactPersonPhone: location.contactPersonPhone ?? '',
    country: location.country ?? '',
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
    companyId: location.companyId ?? location.company?.id ?? null,
  };
}

export function toLocationPayload(values: LocationValues): LocationPayload {
  return {
    name: values.name.trim(),
    phone: values.phone.trim() || null,
    contactPersonPhone: values.contactPersonPhone.trim() || null,
    country: values.country.trim() || null,
    stateProvince: values.stateProvince.trim() || null,
    city: values.city.trim() || null,
    companyId: values.companyId || null,
  };
}

interface LocationFormProps {
  locationId?: string;
  onCancel: () => void;
  onSaved?: (location: Location) => void;
}

type FieldErrors = Partial<Record<keyof LocationValues, string>>;

/** Shared client form for creating and editing a Location. Geographic values are
 * editable text because there is no confirmed reference-data source. */
export function LocationForm({ locationId, onCancel, onSaved }: LocationFormProps) {
  const editing = Boolean(locationId);
  const [values, setValues] = useState<LocationValues>(EMPTY_VALUES);
  const [savedLocation, setSavedLocation] = useState<Location | null>(null);
  const [companies, setCompanies] = useState<LocationCompany[]>([]);
  const [loading, setLoading] = useState(editing);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let current = true;
    getActiveCompanies()
      .then((items) => { if (current) setCompanies(items); })
      .catch(() => { if (current) setFormError('Active Companies could not be loaded. You can still save without a Company.'); })
      .finally(() => { if (current) setOptionsLoading(false); });
    if (locationId) {
      getLocation(locationId)
        .then((location) => {
          if (!current) return;
          setSavedLocation(location);
          setValues(locationToForm(location));
        })
        .catch((error) => {
          if (current) setFormError(error instanceof Error ? error.message : 'Location not found.');
        })
        .finally(() => { if (current) setLoading(false); });
    }
    return () => { current = false; };
  }, [locationId]);

  const companyChoices = useMemo(() => {
    const active = companies.filter((company) => company.isActive !== false);
    const current = savedLocation?.company;
    if (current && !active.some((company) => company.id === current.id)) return [current, ...active];
    return active;
  }, [companies, savedLocation]);

  function change<K extends keyof LocationValues>(field: K, value: LocationValues[K]) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError(null);
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Enter a location name.';
    else if (values.name.trim().length > 100) nextErrors.name = 'Name must be 100 characters or fewer.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = toLocationPayload(values);
      const result = locationId
        ? await updateLocation(locationId, payload)
        : await createLocation(payload);
      setSaved(true);
      onSaved?.(result);
    } catch (error) {
      if (error instanceof LocationApiError) {
        setErrors((current) => ({ ...current, ...error.fieldErrors }));
        if (!Object.keys(error.fieldErrors).length) setFormError(error.message);
      } else {
        setFormError('Location could not be saved. Check the highlighted fields and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card"><Spinner label="Loading Location" /></div>;
  if (editing && !savedLocation) {
    return <div className="flex flex-col gap-3"><Banner kind="error">{formError ?? 'Location not found.'}</Banner><button type="button" className="btn btn--ghost self-start" onClick={onCancel}>Back to Locations</button></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card px-7 py-5">
        <h1 className="text-2xl font-semibold text-ink">{editing ? 'Edit Location' : 'Add Location'}</h1>
        <p className="mt-1 text-sm text-ink-soft">{editing ? <>Update <strong>{savedLocation?.name}</strong>. Your current values are loaded before editing.</> : 'Add a location and its contact details to your organization.'}</p>
      </header>
      {formError && <Banner kind="error">{formError}</Banner>}
      {saved && <Banner kind="success">{editing ? 'Location updated.' : 'Location created.'}</Banner>}
      <form className="card flex flex-col" onSubmit={handleSubmit} noValidate aria-label={editing ? 'Edit location details' : 'Add location details'}>
        <section className="px-7 py-6">
          <h2 className="mb-1 text-base font-semibold text-ink">Location details</h2>
          <p className="text-xs text-ink-soft">{editing ? 'Your current values are loaded before editing.' : 'Enter the information for this location.'}</p>
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label={editing ? 'Location name' : 'Name'} htmlFor="location-name" error={errors.name} hint="Name is required and must be 100 characters or fewer." required>
              <input id="location-name" name="name" value={values.name} maxLength={100} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'location-name-error' : undefined} onChange={(event) => change('name', event.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="location-phone" error={errors.phone} hint="Phone numbers are optional; enter a valid number if provided.">
              <input id="location-phone" name="phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => change('phone', event.target.value)} />
            </Field>
            <Field label="Contact Person’s Phone" htmlFor="contact-person-phone" error={errors.contactPersonPhone}>
              <input id="contact-person-phone" name="contactPersonPhone" type="tel" value={values.contactPersonPhone} aria-invalid={Boolean(errors.contactPersonPhone)} onChange={(event) => change('contactPersonPhone', event.target.value)} />
            </Field>
          </div>
        </section>
        <section className="border-t border-line px-7 py-6">
          <h2 className="mb-4 text-base font-semibold text-ink">Location</h2>
          <p className="mb-4 text-xs text-ink-soft">Geographic options aren’t available right now. Enter saved values where known; no location options are assumed.</p>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-3">
            <Field label="Country" htmlFor="country" error={errors.country}>
              <input id="country" name="country" value={values.country} aria-invalid={Boolean(errors.country)} onChange={(event) => setValues((current) => ({ ...current, country: event.target.value, stateProvince: '', city: '' }))} />
            </Field>
            <Field label="State / Province" htmlFor="state-province" error={errors.stateProvince}>
              <input id="state-province" name="stateProvince" value={values.stateProvince} disabled={!values.country.trim()} placeholder={!values.country.trim() ? 'Choose a country first' : ''} aria-invalid={Boolean(errors.stateProvince)} onChange={(event) => setValues((current) => ({ ...current, stateProvince: event.target.value, city: '' }))} />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city}>
              <input id="city" name="city" value={values.city} disabled={!values.stateProvince.trim()} placeholder={!values.stateProvince.trim() ? 'Choose a state first' : ''} aria-invalid={Boolean(errors.city)} onChange={(event) => change('city', event.target.value)} />
            </Field>
          </div>
        </section>
        <section className="border-t border-line px-7 py-6">
          <h2 className="mb-1 text-base font-semibold text-ink">Company association</h2>
          <p className="mb-4 text-xs text-ink-soft">Choose one active Company associated with this Location.</p>
          <div className="max-w-2xl">
            <Field label="Company (Optional · single company)" htmlFor="companyId" hint={optionsLoading ? 'Loading active Companies…' : companies.length ? 'Clear the selection to leave it unassociated.' : 'No active Companies available. Company is optional.'} error={errors.companyId}>
              <div className="flex gap-2">
                <select id="companyId" name="companyId" value={values.companyId ?? ''} aria-label="Company, optional single selection" disabled={optionsLoading} onChange={(event) => change('companyId', event.target.value || null)}>
                  <option value="">No Company</option>
                  {companyChoices.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
                {values.companyId && <button type="button" className="btn btn--ghost shrink-0" aria-label="Clear Company selection" onClick={() => change('companyId', null)}>Clear</button>}
              </div>
            </Field>
          </div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-canvas px-7 py-4">
          <span className="text-xs text-ink-soft">{editing ? 'Changes are saved without changing Location status.' : 'New locations are created as active.'}</span>
          <div className="flex gap-3">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={submitting || optionsLoading}>{submitting ? 'Saving…' : editing ? 'Save changes' : 'Create location'}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}
