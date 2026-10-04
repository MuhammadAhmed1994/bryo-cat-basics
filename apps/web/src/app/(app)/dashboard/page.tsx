'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { ROLE_LABELS } from '@/lib/types';
import { CompanyIcon } from '@/components/icons';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-4">
      <section className="card px-7 py-6">
        <h1 className="text-2xl font-semibold text-brand">Welcome back, {user?.firstName}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Signed in as {user?.roles.map((role) => ROLE_LABELS[role]).join(' + ')}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link className="card px-7 py-6 transition-colors hover:border-brand" href="/companies">
          <span className="text-brand">
            <CompanyIcon />
          </span>
          <h2 className="mt-3 text-base font-semibold text-ink">Companies</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Add, edit and manage the companies you work with.
          </p>
        </Link>
      </div>
    </div>
  );
}
