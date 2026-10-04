'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Company } from '@/lib/types';
import {
  CompanyForm,
  CompanyFormValues,
  companyToForm,
  toCompanyPayload,
} from '@/features/companies/company-form';
import { Banner, Spinner } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';

/** Spec 2.8.3 — Edit Company. */
export default function EditCompanyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<CompanyFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Company>(`/companies/${params.id}`)
      .then((company) => setInitialValues(companyToForm(company)))
      .catch((error) =>
        setFormError(
          error instanceof ApiError ? error.message : 'We could not load this company.',
        ),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(values: CompanyFormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch<Company>(`/companies/${params.id}`, {
        method: 'PATCH',
        body: toCompanyPayload(values),
      });
      // Spec 2.8.3 — on Update the user returns to Company Details.
      router.push(`/companies/${params.id}`);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'We could not update this company.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading company" />
      </div>
    );
  }

  if (!initialValues) {
    return <Banner kind="error">{formError ?? 'Company not found.'}</Banner>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-7 py-5">
        <button
          type="button"
          aria-label="Back"
          className="text-brand"
          onClick={() => router.push(`/companies/${params.id}`)}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="text-xl font-semibold text-brand">Edit Company</h1>
      </header>

      <CompanyForm
        initialValues={initialValues}
        submitLabel="Update"
        submitting={submitting}
        formError={formError}
        requireChange
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/companies/${params.id}`)}
      />
    </div>
  );
}
