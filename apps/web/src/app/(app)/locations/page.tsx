"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Banner, EmptyState, Spinner, Toast } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { PlusIcon } from "@/components/icons";
import { LocationsTable } from "@/features/locations/locations-table";
import { LocationsFilterBar, StatusFilter } from "@/features/locations/locations-filter-bar";
import { SearchInput } from "@/features/locations/search-input";

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface LocationRow {
  id: string;
  name: string;
  companyId: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface ViewState {
  search: string;
  status: StatusFilter;
  country: string;
  company: string; // company id or ""
  sortDir: "ASC" | "DESC";
  page: number;
  perPage: number;
}

const DEFAULT_VIEW: ViewState = {
  search: "",
  status: "ACTIVE",
  country: "",
  company: "",
  sortDir: "ASC",
  page: 1,
  perPage: 50, // ADR-3 default page size 50
};

export default function LocationsPage() {
  const params = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);

  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(DEFAULT_VIEW.status);
  const [draftCountry, setDraftCountry] = useState<string>(DEFAULT_VIEW.country);
  const [draftCompany, setDraftCompany] = useState<string>(DEFAULT_VIEW.company);
  const [searchInput, setSearchInput] = useState("");

  const [result, setResult] = useState<Paginated<LocationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // AC-6 — show success toast when arriving from /locations/new
    const added = params?.get("added");
    if (added && added !== "0" && added !== "false") {
      setToast("Location added successfully");
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [params]);

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
      setError(err instanceof ApiError ? err.message : "We could not load locations.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  const appliedFilterCount = useMemo(() => {
    return (draftStatus !== "ACTIVE" ? 1 : 0) + (draftCountry ? 1 : 0) + (draftCompany ? 1 : 0);
  }, [draftStatus, draftCountry, draftCompany]);

  function handleApplyFilters() {
    setView((v) => ({
      ...v,
      status: draftStatus,
      country: draftCountry,
      company: draftCompany,
      page: 1,
    }));
  }

  function handleResetFilters() {
    setDraftStatus(DEFAULT_VIEW.status);
    setDraftCountry("");
    setDraftCompany("");
    setSearchInput("");
    setView({ ...DEFAULT_VIEW });
  }

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    setView((v) => ({ ...v, search: searchInput.trim(), page: 1 }));
  }

  const hasRecords = (result?.data.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast} />}

      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Locations{result ? ` (${result.total})` : ""}</h1>
          <p className="mt-1 text-sm text-ink-soft">Use the search box to find specific locations.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add Location
        </Link>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 px-7 py-4">
        <form onSubmit={applySearch} role="search" className="relative">
          <SearchInput
            id="location-search"
            value={searchInput}
            placeholder="Search"
            onChange={setSearchInput}
          />
          <button type="submit" className="sr-only">Search</button>
        </form>

        <LocationsFilterBar
          status={draftStatus}
          country={draftCountry}
          company={draftCompany}
          appliedCount={appliedFilterCount}
          onStatusChange={setDraftStatus}
          onCountryChange={setDraftCountry}
          onCompanyChange={setDraftCompany}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      </section>

      {error && <Banner kind="error">{error}</Banner>}

      {loading && (
        <section className="card">
          <Spinner label="Loading locations" />
        </section>
      )}

      {!loading && hasRecords && result && (
        <section className="card overflow-hidden">
          <LocationsTable
            locations={result.data}
            sortDir={view.sortDir}
            onToggleSort={() => setView((v) => ({ ...v, sortDir: v.sortDir === "ASC" ? "DESC" : "ASC" }))}
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

      {!loading && !hasRecords && (
        <EmptyState title="No locations found." message="" />
      )}
    </div>
  );
}
