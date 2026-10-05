"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Banner, EmptyState, Spinner, Toast } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { PlusIcon } from "@/components/icons";
import { LocationsTable } from "@/features/locations/locations-table";
import { LocationsFilterBar } from "@/features/locations/locations-filter-bar";
import { SearchInput } from "@/features/locations/search-input";

export type LocationStatus = "ACTIVE" | "INACTIVE";

export interface LocationRow {
  id: string;
  name: string;
  status: LocationStatus;
  country: string | null;
  companyId: string | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PAGE_SIZE = 50;

export default function LocationsPage() {
  // Applied state (what the table is currently showing)
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ALL" | "INACTIVE">("ACTIVE");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Drafts in the filter UI before Apply is clicked
  const [draftStatus, setDraftStatus] = useState<"ALL" | "INACTIVE" | null>(null);
  const [draftCountry, setDraftCountry] = useState("");
  const [draftCompany, setDraftCompany] = useState("");

  const [result, setResult] = useState<Paginated<LocationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddedToast, setShowAddedToast] = useState(false);

  // Applied count excludes the search term and only counts non-default filters
  const appliedCount = useMemo(() => {
    let c = 0;
    if (status !== "ACTIVE") c += 1;
    if (country) c += 1;
    if (company) c += 1;
    return c;
  }, [status, country, company]);

  const hasRecords = (result?.data.length ?? 0) > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        search: search || undefined,
        status,
        country: country || undefined,
        company: company || undefined,
        sortDir,
        page,
        perPage: DEFAULT_PAGE_SIZE,
      });
      const pageData = await apiFetch<Paginated<LocationRow>>(`/locations${query}`);
      setResult(pageData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load locations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, status, country, company, sortDir, page]);

  useEffect(() => {
    // success flag handled via URL parameter ?added=1
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("added") === "1") {
        setShowAddedToast(true);
        // remove the flag from the URL without reloading
        params.delete("added");
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSearchSubmit(value: string) {
    setSearch(value.trim());
    setPage(1);
  }

  function handleApply() {
    setStatus(draftStatus ?? "ACTIVE");
    setCountry(draftCountry.trim());
    setCompany(draftCompany.trim());
    setPage(1);
  }

  function handleReset() {
    // Clear both the applied and draft values and the search box
    setSearch("");
    setStatus("ACTIVE");
    setCountry("");
    setCompany("");
    setDraftStatus(null);
    setDraftCountry("");
    setDraftCompany("");
    setSortDir("ASC");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
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
        <SearchInput onSubmit={handleSearchSubmit} resetKey={`${status}|${country}|${company}`} />
        <LocationsFilterBar
          appliedCount={appliedCount}
          statusDraft={draftStatus}
          onStatusDraftChange={setDraftStatus}
          countryDraft={draftCountry}
          onCountryDraftChange={setDraftCountry}
          companyDraft={draftCompany}
          onCompanyDraftChange={setDraftCompany}
          onApply={handleApply}
          onReset={handleReset}
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
            sortDir={sortDir}
            onToggleSort={() => setSortDir((s) => (s === "ASC" ? "DESC" : "ASC"))}
          />
          <div className="border-t border-line">
            <Pagination
              total={result.total}
              page={result.page}
              perPage={result.perPage}
              onPageChange={(p) => setPage(p)}
              onPerPageChange={() => { /* fixed at 50 per AC-21 */ }}
            />
          </div>
        </section>
      )}

      {!loading && !hasRecords && (
        <EmptyState
          title="No locations found."
          message="Try adjusting your search or clearing filters."
          action={<button type="button" className="btn btn--ghost" onClick={handleReset}>Reset Filters</button>}
        />
      )}

      {showAddedToast && <Toast message="Location added successfully" />}
    </div>
  );
}
