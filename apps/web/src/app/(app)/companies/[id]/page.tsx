'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { Address, Company } from '@/lib/types';
import { Banner, Spinner, StatusDot, Toast } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/icons';

/** Spec 2.8.2 — Company Details, with activate/deactivate and delete. */
export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCompany(await apiFetch<Company>(`/companies/${params.id}`));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not load this company.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Spec 2.2.8 — success toasts clear themselves after 3 seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function toggleActive() {
    if (!company) return;
    try {
      const updated = await apiFetch<Company & { message: string }>(
        `/companies/${company.id}/status`,
        { method: 'PATCH', body: { isActive: !company.isActive } },
      );
      setCompany(updated);
      setToast(updated.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not update this company.');
    }
  }

  async function handleDelete() {
    if (!company) return;
    try {
      await apiFetch(`/companies/${company.id}`, { method: 'DELETE' });
      // Spec 2.8.4 — after a delete the user lands back on the list.
      router.push('/companies');
    } catch (err) {
      setConfirmingDelete(false);
      setError(err instanceof ApiError ? err.message : 'We could not delete this company.');
    }
  }

  if (loading) {
    return (
      <div className="card">
        <Spinner label="Loading company" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col gap-4">
        <Banner kind="error">{error ?? 'Company not found.'}</Banner>
        <Link className="link" href="/companies">
          Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <header className="card flex flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex items-center gap-2">
          <Link href="/companies" aria-label="Back" className="text-brand">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-semibold text-brand">{company.name}</h1>
          <span className="ml-2 inline-flex items-center gap-2 text-sm text-ink-soft">
            <StatusDot active={company.isActive} />
            {company.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Spec 2.8.5 — activate/deactivate from the details screen. */}
          <button type="button" className="btn btn--ghost" onClick={() => void toggleActive()}>
            {company.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <Link className="btn btn--ghost" href={`/companies/${company.id}/edit`}>
            Edit
          </Link>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete
          </button>
        </div>
      </header>

      {error && <Banner kind="error">{error}</Banner>}

      {confirmingDelete && (
        <div
          className="card flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-red-600 px-7 py-5"
          role="alertdialog"
          aria-label="Confirm delete"
        >
          <p className="m-0 font-semibold">Are you sure you want to delete this company?</p>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirmingDelete(false)}
            >
              No
            </button>
            <button type="button" className="btn btn--danger" onClick={() => void handleDelete()}>
              Yes
            </button>
          </div>
        </div>
      )}

      <Section title="Company">
        <Detail label="Name" value={company.name} />
        <Detail label="Phone Number" value={company.phone} />
        <Detail label="Email" value={company.email} />
        <Detail label="Website" value={company.website} />
      </Section>

      <Section title="Billing Address">
        <AddressDetail address={company.billingAddress} />
      </Section>

      <Section
        title="Shipping Address"
        note={company.shippingSameAsBilling ? 'Same as billing address' : undefined}
      >
        <AddressDetail address={company.shippingAddress} />
      </Section>

      {/* Spec 2.2.9 — audit information on every record. */}
      <Section title="Audit">
        <Detail label="Added Date" value={formatDate(company.createdAt)} />
        <Detail label="Updated Date" value={formatDate(company.updatedAt)} />
      </Section>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card px-7 py-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
      <dl className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{children}</dl>
    </section>
  );
}

/** Spec 2.8.2 — show a dash when an optional value is missing. */
function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-brand">{label}</dt>
      <dd className="m-0 mt-1 break-words text-sm text-ink">{value?.trim() ? value : '-'}</dd>
    </div>
  );
}

function AddressDetail({ address }: { address: Address }) {
  return (
    <>
      <Detail label="Address Line 1" value={address.line1} />
      <Detail label="Address Line 2" value={address.line2} />
      <Detail label="Country" value={address.country} />
      <Detail label="State/Province" value={address.state} />
      <Detail label="City" value={address.city} />
      <Detail label="Postal Code" value={address.postalCode} />
    </>
  );
}

/**
 * Spec 2.4.1 — the default display format is "Aug 13, 2026"; timestamps are
 * stored in UTC and formatted for display only.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}
