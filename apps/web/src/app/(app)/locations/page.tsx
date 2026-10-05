"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, buildQuery } from "@/lib/api";
import { Paginated } from "@/lib/types";
import { Banner, EmptyState, Spinner, Toast } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { PlusIcon } from "@/components/icons";
import { LocationsTable } from "@/features/locations/locations-table";
import { SearchInput } from "@/features/locations/search-input";
import { LocationsFilterBar } from "@/features/locations/locations-filter-bar";

// Minimal client-side shape for the list
interface LocationRow {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  companyId: string | null;
}

type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

interface View {
  search: string;
  status: StatusFilter; // default ACTIVE
  country: string; // stored as plain text in API
  company: string; // company id
  sortDir: "ASC" | "DESC";
  page: number;
  perPage: number;
}

const DEFAULT_VIEW: View = {
  search: "",
  status: "ACTIVE",
  country: "",
  company: "",
  sortDir: "ASC",
  page: 1,
  perPage: 50, // AC-21 default page size 50
};

export default function LocationsPage() {
  const [view, setView] = useState<View>({ ...DEFAULT_VIEW });
  const [searchInput, setSearchInput] = useState("");

  const [result, setResult] = useState<Paginated<LocationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  // Read the success flag placed in the URL or session and show a toast once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const added = sp.get("added");
    const ss = window.sessionStorage.getItem("nbryo.locations.added");
    if (added === "1" || ss === "1") {
      setToast("Location added successfully"); // AC-6
      // Clean up so it doesn't re-show on navigation
      if (added === "1") {
        sp.delete("added");
        const url = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`;
        window.history.replaceState({}, "", url);
      }
      window.sessionStorage.removeItem("nbryo.locations.added");
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
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
      setError(err instanceof ApiError ? err.message : "Couldn't load locations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleApplyFilters(values: { status: StatusFilter | "DEFAULT"; country: string; company: string }) {
    setView((v) => ({
      ...v,
      status: values.status === "DEFAULT" ? "ACTIVE" : (values.status as StatusFilter),
      country: values.country,
      company: values.company,
      page: 1,
    }));
  }

  function handleReset() {
    setSearchInput("");
    setView({ ...DEFAULT_VIEW }); // AC-21
  }

  function handleSearchSubmit() {
    setView((v) => ({ ...v, search: searchInput.trim(), page: 1 }));
  }

  const hasRows = (result?.data.length ?? 0) > 0;

  // AC-22 — count only explicit non-default filters (status != ACTIVE, country, company)
  const appliedCount = useMemo(() => {
    let c = 0;
    if (view.status !== "ACTIVE") c += 1;
    if (view.country) c += 1;
    if (view.company) c += 1;
    return c;
  }, [view.status, view.country, view.company]);

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

      <section className="card flex flex-col gap-4 px-7 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
          />
          <div className="text-sm text-ink-soft" aria-live="polite">Filters ({appliedCount})</div>
        </div>
        <LocationsFilterBar
          status={view.status}
          country={view.country}
          company={view.company}
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

      {!loading && !hasRows && (
        <EmptyState title="No locations found." message="" />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
