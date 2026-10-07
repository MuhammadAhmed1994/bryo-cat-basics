'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { Banner, Spinner, Toast } from '@/components/ui';
import { createLocation, getCities, getCountries, getStates, updateLocation } from './location-api';
import type { Company } from '@/lib/types';
import type { Location, CreateLocationPayload } from './location-types';

interface LocationFormProps {
  mode: 'create' | 'edit';
  locationId?: string;
  initialLocation?: Location;
  companies?: Company[];
}

interface Values {
  name: string;
  companyId: string;
  phone: string;
  country: string;
  stateProvince: string;
  city: string;
}

const blankValues: Values = {
  name: '',
  companyId: '',
  phone: '',
  country: '',
  stateProvince: '',
  city: '',
};

function toValues(location?: Location): Values {
  return location
    ? {
        name: location.name ?? '',
        companyId: location.companyId ?? '',
        phone: location.phone ?? '',
        country: location.country ?? '',
        stateProvince: location.stateProvince ?? '',
        city: location.city ?? '',
      }
    : { ...blankValues };
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

function fieldFor(message: string): keyof Values | null {
  const text = message.toLowerCase();
  if (text.includes('company')) return 'companyId';
  if (text.includes('phone')) return 'phone';
  if (text.includes('country')) return 'country';
  if (text.includes('state') || text.includes('province')) return 'stateProvince';
  if (text.includes('city')) return 'city';
  if (text.includes('name')) return 'name';
  return null;
}

export function LocationForm({ mode, locationId, initialLocation, companies = [] }: LocationFormProps) {
  const router = useRouter();
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState<Values>(() => toValues(initialLocation));
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => () => {
    if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
  }, []);

  useEffect(() => {
    let active = true;
    getCountries()
      .then((items) => { if (active) setCountries(items); })
      .catch((error: unknown) => { if (active) setReferenceError(messageFor(error)); })
      .finally(() => { if (active) setCountriesLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setStates([]);
    setCities([]);
    if (!values.country) {
      setStatesLoading(false);
      return () => { active = false; };
    }
    setStatesLoading(true);
    getStates(values.country)
      .then((items) => { if (active) setStates(items); })
      .catch((error: unknown) => { if (active) setReferenceError(messageFor(error)); })
      .finally(() => { if (active) setStatesLoading(false); });
    return () => { active = false; };
  }, [values.country]);

  useEffect(() => {
    let active = true;
    setCities([]);
    if (!values.country || !values.stateProvince) {
      setCitiesLoading(false);
      return () => { active = false; };
    }
    setCitiesLoading(true);
    getCities(values.country, values.stateProvince)
      .then((items) => { if (active) setCities(items); })
      .catch((error: unknown) => { if (active) setReferenceError(messageFor(error)); })
      .finally(() => { if (active) setCitiesLoading(false); });
    return () => { active = false; };
  }, [values.country, values.stateProvince]);

  function change(key: keyof Values, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'country' ? { stateProvince: '', city: '' } : {}),
      ...(key === 'stateProvince' ? { city: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function cancel() {
    if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
    router.push(mode === 'create' ? '/locations' : `/locations/${locationId}`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    const payload: CreateLocationPayload = {
      name: values.name,
      companyId: values.companyId || null,
      phone: values.phone || null,
      country: values.country,
      stateProvince: values.stateProvince || null,
      city: values.city || null,
    };
    try {
      const saved = mode === 'create'
        ? await createLocation(payload)
        : await updateLocation(locationId!, payload);
      const message = mode === 'create' ? 'Location saved.' : 'Location updated.';
      setSuccess(message);
      if (typeof window !== 'undefined') window.sessionStorage.setItem('nbryo.locations.toast', message);
      navigationTimeout.current = setTimeout(() => {
        router.push(`/locations/${saved.id}`);
        navigationTimeout.current = null;
      }, 900);
    } catch (error) {
      const message = messageFor(error);
      const field = fieldFor(message);
      if (field) setErrors({ [field]: message });
      else setFormError(message || (error instanceof ApiError ? error.message : ''));
    } finally {
      setSubmitting(false);
    }
  }

  const cancelHref = mode === 'create' ? '/locations' : `/locations/${locationId}`;
  const stateDisabled = !values.country || countriesLoading || statesLoading;
  const cityDisabled = !values.stateProvince || statesLoading || citiesLoading;

  if (mode === 'edit' && !initialLocation) return <Spinner label="Loading location" />;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">{mode === 'create' ? 'Add location' : 'Edit location'}</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-soft">
          {mode === 'create'
            ? 'Create a location and choose its geographic details. State or province options depend on the country, and city options depend on the state or province.'
            : 'Update the details for this location. Changing a geographic parent clears any child selection that is no longer valid.'}
        </p>
      </header>

      {formError && <Banner kind="error">{formError}</Banner>}
      {referenceError && <Banner kind="error">{referenceError}</Banner>}
      {success && <Toast message={success} />}

      <section className="card max-w-3xl overflow-hidden" aria-labelledby="location-form-heading">
        <div className="border-b border-line px-6 py-5">
          <h2 id="location-form-heading" className="text-lg font-semibold text-ink">Location details</h2>
          {mode === 'edit' && <p className="mt-1 text-sm text-ink-soft">Manage the name, contact information, and geographic details.</p>}
        </div>
        <form onSubmit={submit} noValidate>
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 px-6 py-6 md:grid-cols-2">
            <Field label="Name" name="name" value={values.name} error={errors.name} onChange={change} />
            <div className="field">
              <label htmlFor="location-company">Company <span className="text-ink-muted">(optional)</span></label>
              <select id="location-company" value={values.companyId} aria-describedby={errors.companyId ? 'error-companyId' : undefined}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm" onChange={(event) => change('companyId', event.target.value)}>
                <option value="">No company</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
              {errors.companyId && <p id="error-companyId" role="alert" className="error">{errors.companyId}</p>}
            </div>
            <Field label="Phone" name="phone" value={values.phone} error={errors.phone} onChange={change} type="tel" />
            <div className="field md:col-span-2">
              <h3 className="mb-1 font-semibold text-ink-soft">Geographic location</h3>
              <p className="mb-4 text-sm text-ink-soft">Choose a country before selecting a state or province. Choose a state or province before selecting a city.</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SelectField label="Country" name="country" value={values.country} options={countries} loading={countriesLoading} error={errors.country} onChange={change} />
                <SelectField label="State/Province" name="stateProvince" value={values.stateProvince} options={states} disabled={stateDisabled} loading={statesLoading} error={errors.stateProvince} onChange={change} />
                <SelectField label="City" name="city" value={values.city} options={cities} disabled={cityDisabled} loading={citiesLoading} error={errors.city} onChange={change} />
              </div>
              {(countriesLoading || statesLoading || citiesLoading) && <p className="mt-3 text-sm text-ink-soft" role="status">Loading location options…</p>}
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-line bg-canvas/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-ink-soft">Location details</span>
            <div className="flex items-center justify-end gap-4">
              <button type="button" className="btn btn--ghost" onClick={cancel}>Cancel</button>
              <button type="submit" disabled={submitting || Boolean(success)} className="btn btn--primary">
                {submitting ? 'Saving…' : mode === 'create' ? 'Save location' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, name, value, error, onChange, type = 'text' }: {
  label: string; name: 'name' | 'phone'; value: string; error?: string;
  onChange: (key: keyof Values, value: string) => void; type?: string;
}) {
  const id = `location-${name}`;
  const errorId = `error-${name}`;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <input id={id} type={type} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm" onChange={(event) => onChange(name, event.target.value)} />
    {error && <p id={errorId} role="alert" className="error">{error}</p>}
  </div>;
}

function SelectField({ label, name, value, options, disabled = false, loading, error, onChange }: {
  label: string; name: 'country' | 'stateProvince' | 'city'; value: string; options: string[];
  disabled?: boolean; loading: boolean; error?: string; onChange: (key: keyof Values, value: string) => void;
}) {
  const id = `location-${name}`;
  const errorId = `error-${name}`;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} disabled={disabled || loading} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-muted"
      onChange={(event) => onChange(name, event.target.value)}>
      <option value="">{loading ? 'Loading…' : `Select ${label.toLowerCase()}`}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
    {error && <p id={errorId} role="alert" className="error">{error}</p>}
  </div>;
}
