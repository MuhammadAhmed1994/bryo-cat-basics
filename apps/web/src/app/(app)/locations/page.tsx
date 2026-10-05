"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Banner, EmptyState, Spinner, Toast } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { LocationsTable } from "@/features/locations/locations-table";
import { LocationsFilterBar, LocationsFilterValues } from "@/features/locations/locations-filter-bar";
import { SearchInput } from "@/features/locations/search-input";

interface LocationRow {
  id: string;
  name: string;
  companyId: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

type SortDir = "ASC" | "DESC";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface ViewState extends LocationsFilterValues {
  search: string;
  sortDir: SortDir;
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
  perPage: 50, // AC-21 default page size 50
};

export default function LocationsPage() {
  const [view, setView] = useState<ViewState>({ ...DEFAULT_VIEW });
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState<Paginated<LocationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddedToast, setShowAddedToast] = useState(false);

  // Detect a successful creation redirect (AC-6)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const addedParam = url.searchParams.get("added");
    const flag = window.sessionStorage.getItem("nbryo.locations.added");
    if (addedParam === "1" || flag === "1") {
      setShowAddedToast(true);
      window.sessionStorage.removeItem("nbryo.locations.added");
      // Auto-dismiss after 5s
      const t = setTimeout(() => setShowAddedToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (view.status !== "ACTIVE") count += 1;
    if (view.country) count += 1;
    if (view.company) count += 1;
    return count;
  }, [view.status, view.country, view.company]);

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
      setError(err instanceof ApiError ? err.message : "Couldn't load locations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleApplyFilters(values: LocationsFilterValues) {
    setView((v) => ({ ...v, ...values, page: 1 }));
  }

  function handleResetFilters() {
    setSearchInput("");
    setView({ ...DEFAULT_VIEW });
  }

  function handleSearchSubmit() {
    setView((v) => ({ ...v, search: searchInput.trim(), page: 1 }));
  }

  const hasRows = (result?.data.length ?? 0) > 0;

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

      <section className="card flex flex-col gap-3 px-7 py-4">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
        />
        <LocationsFilterBar
          values={{ status: view.status, country: view.country, company: view.company }}
          appliedCount={appliedFilterCount}
          onChange={(values) => setView((v) => ({ ...v, ...values }))}
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

      {!loading && hasRows && result && (
        <section className="card overflow-hidden">
          <LocationsTable locations={result.data} />
        </section>
      )}

      {!loading && !hasRows && (
        <EmptyState title="No locations found." message="" />
      )}

      {showAddedToast && <Toast message="Location added successfully" />}
    </div>
  );
}
