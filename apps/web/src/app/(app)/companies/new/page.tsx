'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Company } from '@/lib/types';
import {
  CompanyForm,
  CompanyFormValues,
  toCompanyPayload,
} from '@/features/companies/company-form';
import { ChevronLeftIcon } from '@/components/icons';

/** Spec 2.8.1 — Add Company. */
export default function NewCompanyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: CompanyFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch<Company>('/companies', {
        method: 'POST',
        body: toCompanyPayload(values),
      });
      // Spec 2.8.1 — on Save the user returns to the List of Companies.
      router.push('/companies');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'We could not save this company.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back"
          className="text-brand"
          onClick={() => router.push('/companies')}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Add Company</h1>
      </header>

      <CompanyForm
        submitLabel="Save"
        submitting={submitting}
        formError={formError}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/companies')}
      />
    </div>
  );
}
