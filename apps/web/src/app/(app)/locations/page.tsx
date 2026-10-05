"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Banner, EmptyState, Spinner, Toast } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { LocationsTable } from "@/features/locations/locations-table";
import { LocationsFilterBar, LocationsFilterDraft } from "@/features/locations/locations-filter-bar";
import { SearchInput } from "@/features/locations/search-input";

export interface LocationRow {
  id: string;
  name: string;
  companyName: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

interface ViewState {
  search: string;
  status: StatusFilter;
  country: string;
  company: string; // company id
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
  perPage: 50,
};

/** Public export for tests: the stateful list UI. */
export function LocationsList({ showToastInitial = false }: { showToastInitial?: boolean }) {
  const [view, setView] = useState<ViewState>({ ...DEFAULT_VIEW });
  const [draft, setDraft] = useState<LocationsFilterDraft>({
    status: DEFAULT_VIEW.status,
    country: "",
    company: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState<Paginated<LocationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(showToastInitial ? "Location added successfully" : null);

  const activeFilterCount = useMemo(
    () => (view.status !== "ACTIVE" ? 1 : 0) + (view.country ? 1 : 0) + (view.company ? 1 : 0),
    [view.status, view.country, view.company],
  );

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
      setError(err instanceof ApiError ? err.message : "Couldn't load locations.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function applySearch(event?: React.FormEvent) {
    if (event) event.preventDefault();
    setView((v) => ({ ...v, search: searchInput.trim(), page: 1 }));
  }

  function applyFilters() {
    setView((v) => ({ ...v, ...draft, page: 1 }));
  }

  function resetAll() {
    setSearchInput("");
    setDraft({ status: DEFAULT_VIEW.status, country: "", company: "" });
    setView({ ...DEFAULT_VIEW });
  }

  const hasRows = (result?.data.length ?? 0) > 0;

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

      <section className="card flex flex-wrap items-center gap-4 px-7 py-4">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          placeholder="e.g. Sydney Office"
          ariaLabel="Search locations by name"
        />

        <LocationsFilterBar
          value={draft}
          onChange={setDraft}
          appliedCount={activeFilterCount}
          onApply={applyFilters}
          onReset={resetAll}
        />
      </section>

      <p className="mx-0 mb-0 mt-1 text-xs text-ink-soft">Default view: Active locations, sorted A→Z, 50 per page.</p>

      {error && <Banner kind="error">{error}</Banner>}

      {loading && (
        <section className="card">
          <Spinner label="Loading locations" />
        </section>
      )}

      {!loading && hasRows && result && (
        <section className="card overflow-hidden">
          <LocationsTable rows={result.data} />
        </section>
      )}

      {!loading && !hasRows && (
        <EmptyState title="No locations found." message="" />
      )}
    </div>
  );
}

export default function LocationsPage() {
  const params = useSearchParams();
  const showToast = params?.get("added") === "1" || params?.get("added") === "true" || params?.get("added") === "success";
  return <LocationsList showToastInitial={showToast} />;
}
