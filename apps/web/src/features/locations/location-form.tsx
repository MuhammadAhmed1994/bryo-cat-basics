'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Banner, Spinner, Toast } from '@/components/ui';
import type { Company, Paginated } from '@/lib/types';
import {
  createLocation,
  getLocationCities,
  getLocationCountries,
  getLocationStates,
  updateLocation,
} from './location-api';
import type { CreateLocationInput, Location } from './location-types';

export interface LocationFormValues {
  name: string;
  companyId: string;
  phone: string;
  country: string;
  stateProvince: string;
  city: string;
}

const EMPTY_VALUES: LocationFormValues = {
  name: '',
  companyId: '',
  phone: '',
  country: '',
  stateProvince: '',
  city: '',
};

export function locationToForm(location: Location): LocationFormValues {
  return {
    name: location.name,
    companyId: location.companyId ?? '',
    phone: location.phone ?? '',
    country: location.country,
    stateProvince: location.stateProvince ?? '',
    city: location.city ?? '',
  };
}

interface LocationFormProps {
  mode: 'create' | 'edit';
  locationId?: string;
  initialValues?: LocationFormValues;
}

type FormField = keyof LocationFormValues;

function fieldForValidation(message: string): FormField | null {
  const normalized = message.toLowerCase();
  if (normalized.includes('country')) return 'country';
  if (normalized.includes('state') || normalized.includes('province')) return 'stateProvince';
  if (normalized.includes('city')) return 'city';
  if (normalized.includes('phone')) return 'phone';
  if (normalized.includes('company')) return 'companyId';
  if (normalized.includes('name')) return 'name';
  return null;
}

function LocationField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="hint" aria-live="polite">{hint}</p>}
      {error && <p id={`${id}-error`} className="error" role="alert">{error}</p>}
    </div>
  );
}

/** Shared create/edit form; geographic choices are always loaded from the API. */
export function LocationForm({ mode, locationId, initialValues = EMPTY_VALUES }: LocationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLoadError, setCompanyLoadError] = useState<string | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setCountriesLoading(true);
    getLocationCountries()
      .then((choices) => current && setCountries(choices))
      .catch((error: unknown) => {
        if (current) setReferenceError(error instanceof Error ? error.message : '');
      })
      .finally(() => current && setCountriesLoading(false));
    apiFetch<Paginated<Company>>('/companies?status=ACTIVE&perPage=100')
      .then((result) => current && setCompanies(result.data))
      .catch((error: unknown) => {
        if (current) setCompanyLoadError(error instanceof Error ? error.message : '');
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    setStates([]);
    if (!values.country) {
      setStatesLoading(false);
      return () => {
        current = false;
      };
    }
    setStatesLoading(true);
    getLocationStates(values.country)
      .then((choices) => current && setStates(choices))
      .catch((error: unknown) => current && setReferenceError(error instanceof Error ? error.message : ''))
      .finally(() => current && setStatesLoading(false));
    return () => {
      current = false;
    };
  }, [values.country]);

  useEffect(() => {
    let current = true;
    setCities([]);
    if (!values.country || !values.stateProvince) {
      setCitiesLoading(false);
      return () => {
        current = false;
      };
    }
    setCitiesLoading(true);
    getLocationCities(values.country, values.stateProvince)
      .then((choices) => current && setCities(choices))
      .catch((error: unknown) => current && setReferenceError(error instanceof Error ? error.message : ''))
      .finally(() => current && setCitiesLoading(false));
    return () => {
      current = false;
    };
  }, [values.country, values.stateProvince]);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function changeCountry(country: string) {
    setValues((current) => ({ ...current, country, stateProvince: '', city: '' }));
    setStates([]);
    setCities([]);
    setStatesLoading(Boolean(country));
    setCitiesLoading(false);
    setErrors((current) => ({ ...current, country: undefined, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  function changeState(stateProvince: string) {
    setValues((current) => ({ ...current, stateProvince, city: '' }));
    setCities([]);
    setCitiesLoading(Boolean(stateProvince));
    setErrors((current) => ({ ...current, stateProvince: undefined, city: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setErrors({});
    const input: CreateLocationInput = {
      name: values.name,
      companyId: values.companyId || null,
      phone: values.phone || null,
      country: values.country,
      stateProvince: values.stateProvince || null,
      city: values.city || null,
    };
    try {
      const result = mode === 'create'
        ? await createLocation(input)
        : await updateLocation(locationId!, input);
      setToast(result.message || (mode === 'create' ? 'Location added successfully.' : 'Location updated successfully.'));
      window.setTimeout(() => router.push(`/locations/${result.id}`), 900);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : '';
      const field = fieldForValidation(message);
      if (field) setErrors({ [field]: message });
      else setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  const stateDisabled = !values.country || statesLoading || countriesLoading;
  const cityDisabled = !values.stateProvince || citiesLoading || statesLoading;

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}
      <header className="card px-7 py-6">
        <h1 className="text-2xl font-semibold text-brand">{mode === 'create' ? 'Add location' : 'Edit location'}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {mode === 'create'
            ? 'Create a location and choose its geographic details. State or province options depend on the country, and city options depend on the state or province.'
            : 'Update the details for this location. Changing a geographic parent clears any child selection that is no longer valid.'}
        </p>
      </header>

      {countriesLoading && <div className="card"><Spinner label="Loading location options" /></div>}
      {referenceError && <Banner kind="error">{referenceError}</Banner>}
      {companyLoadError && <Banner kind="error">{companyLoadError}</Banner>}
      {formError && <Banner kind="error">{formError}</Banner>}

      <section className="card px-7 py-6" aria-labelledby="location-details-heading">
        <h2 id="location-details-heading" className="mb-5 text-lg font-semibold text-ink">Location details</h2>
        <form id="location-form" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <LocationField id="location-name" label="Name" error={errors.name}>
              <input id="location-name" value={values.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'location-name-error' : undefined} onChange={(event) => update('name', event.target.value)} />
            </LocationField>
            <LocationField id="location-company" label="Company (optional)" error={errors.companyId}>
              <select id="location-company" value={values.companyId} aria-invalid={Boolean(errors.companyId)} aria-describedby={errors.companyId ? 'location-company-error' : undefined} onChange={(event) => update('companyId', event.target.value)}>
                <option value="">No company</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </LocationField>
            <LocationField id="location-phone" label="Phone" error={errors.phone}>
              <input id="location-phone" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'location-phone-error' : undefined} onChange={(event) => update('phone', event.target.value)} />
            </LocationField>
            <div className="md:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-ink-soft">Geographic location</h3>
            </div>
            <LocationField id="location-country" label="Country" error={errors.country}>
              <select id="location-country" value={values.country} disabled={countriesLoading || Boolean(referenceError)} aria-invalid={Boolean(errors.country)} aria-describedby={errors.country ? 'location-country-error' : undefined} onChange={(event) => changeCountry(event.target.value)}>
                <option value="">Select a country</option>
                {countries.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </LocationField>
            <LocationField id="location-state" label="State/Province" error={errors.stateProvince} hint={statesLoading ? 'Loading options…' : !values.country ? 'Choose a country before selecting a state or province.' : undefined}>
              <select id="location-state" value={values.stateProvince} disabled={stateDisabled} aria-invalid={Boolean(errors.stateProvince)} aria-describedby={errors.stateProvince ? 'location-state-error' : statesLoading || !values.country ? 'location-state-hint' : undefined} onChange={(event) => changeState(event.target.value)}>
                <option value="">Select a state or province</option>
                {states.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </LocationField>
            <div className="md:col-span-2">
              <LocationField id="location-city" label="City" error={errors.city} hint={citiesLoading ? 'Loading options…' : !values.stateProvince ? 'Choose a state or province before selecting a city.' : undefined}>
                <select id="location-city" value={values.city} disabled={cityDisabled} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'location-city-error' : citiesLoading || !values.stateProvince ? 'location-city-hint' : undefined} onChange={(event) => update('city', event.target.value)}>
                  <option value="">Select a city</option>
                  {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </LocationField>
            </div>
          </div>
        </form>
      </section>

      <div className="card flex flex-wrap items-center justify-end gap-3 px-7 py-4">
        <button type="button" className="btn btn--ghost" onClick={() => router.push(mode === 'create' ? '/locations' : `/locations/${locationId}`)}>Cancel</button>
        <button type="submit" form="location-form" className="btn btn--primary" disabled={saving || countriesLoading || Boolean(referenceError)}>
          {saving ? 'Saving…' : mode === 'create' ? 'Save location' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
