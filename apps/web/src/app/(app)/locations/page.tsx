'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError, apiFetch, buildQuery } from '@/lib/api';
import { Paginated } from '@/lib/types';
import { Banner, EmptyState, Spinner, Toast } from '@/components/ui';
import { Pagination } from '@/components/pagination';
import { PlusIcon } from '@/components/icons';
import { LocationsTable, LocationRow } from '@/features/locations/locations-table';
import { SearchInput } from '@/features/locations/search-input';
import { LocationsFilterBar, StatusDraftOption, CompanyOption } from '@/features/locations/locations-filter-bar';

interface ViewState {
  search: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ALL';
  country: string;
  company: string; // company id
  sortDir: 'ASC' | 'DESC';
  page: number;
  perPage: number;
}

const DEFAULT_VIEW: ViewState = {
  search: '',
  status: 'ACTIVE',
  country: '',
  company: '',
  sortDir: 'ASC',
  page: 1,
  perPage: 50,
};

export default function LocationsPage() {
  const params = useSearchParams();

  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<Paginated<LocationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Draft filter values edited in the filter bar before Apply.
  const [draftStatus, setDraftStatus] = useState<StatusDraftOption>('');
  const [draftCountry, setDraftCountry] = useState<string>('');
  const [draftCompany, setDraftCompany] = useState<string>('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  // Show the success toast when redirected from the create page.
  useEffect(() => {
    if (params?.get('added') === '1') {
      setToast('Location added successfully');
    }
  }, [params]);

  // Auto-dismiss success toasts after 5 seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load active companies for the Company filter.
  useEffect(() => {
    void apiFetch<Paginated<{ id: string; name: string }>>('/companies?status=ACTIVE&perPage=100')
      .then((page) => setCompanies(page.data.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => setCompanies([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        search: view.search || undefined,
        status: view.status,
        country: view.country || undefined,
        company: view.company || undefined,
        sortDir: view.sortDir,
        page: view.page,
        perPage: view.perPage,
      });
      const page = await apiFetch<Paginated<LocationRow>>(`/locations${query}`);
      setResult(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not load locations.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  // Applied filter count (search is not counted).
  const appliedFilterCount = useMemo(
    () => (view.status !== 'ACTIVE' ? 1 : 0) + (view.country ? 1 : 0) + (view.company ? 1 : 0),
    [view],
  );

  function handleApplyFilters() {
    setView((v) => ({
      ...v,
      status: draftStatus || 'ACTIVE',
      country: draftCountry.trim(),
      company: draftCompany,
      page: 1,
    }));
  }

  function handleReset() {
    setSearchInput('');
    setDraftStatus('');
    setDraftCountry('');
    setDraftCompany('');
    setView({ ...DEFAULT_VIEW });
  }

  function handleSearchSubmit() {
    setView((v) => ({ ...v, search: searchInput.trim(), page: 1 }));
  }

  const hasRows = (result?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Locations{result ? ` (${result.total})` : ''}</h1>
          <p className="mt-1 text-sm text-ink-soft">Use the search box to find specific locations.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add Location
        </Link>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 px-7 py-4">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearchSubmit}
        />
        <LocationsFilterBar
          status={draftStatus}
          country={draftCountry}
          company={draftCompany}
          companies={companies}
          appliedCount={appliedFilterCount}
          onStatusChange={setDraftStatus}
          onCountryChange={setDraftCountry}
          onCompanyChange={setDraftCompany}
          onApply={handleApplyFilters}
          onReset={handleReset}
        />
      </section>

      {error && <Banner kind="error">{error}</Banner>}

      {loading && (
        <section className="card">
          <Spinner label="Loading locations" />
        </section>
      )}

      {!loading && hasRows && result && (
        <section className="card overflow-hidden">
          <LocationsTable
            locations={result.data}
            sortDir={view.sortDir}
            onToggleSort={() => setView((v) => ({ ...v, sortDir: v.sortDir === 'ASC' ? 'DESC' : 'ASC' }))}
          />
          <div className="border-t border-line">
            <Pagination
              total={result.total}
              page={result.page}
              perPage={result.perPage}
              onPageChange={(page) => setView((v) => ({ ...v, page }))}
              onPerPageChange={(perPage) => setView((v) => ({ ...v, perPage, page: 1 }))}
            />
          </div>
        </section>
      )}

      {!loading && !hasRows && (
        <EmptyState
          title="No locations found."
          message="Try adjusting your search or clearing filters to see results."
          action={<button type="button" className="btn btn--ghost" onClick={handleReset}>Reset Filters</button>}
        />
      )}
    </div>
  );
}
