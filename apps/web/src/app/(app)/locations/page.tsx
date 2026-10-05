"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon, SearchIcon, FilterIcon } from "@/components/icons";
import { Toast } from "@/components/ui";
import { LocationsTable } from "@/features/locations/locations-table";
import { LocationsFilterBar, LocationsFilterValues } from "@/features/locations/locations-filter-bar";
import { SearchInput } from "@/features/locations/search-input";

export type LocationListItem = {
  id: string;
  name: string;
  company: string | null; // display "-" when null
  country?: string | null;
  status: "ACTIVE" | "INACTIVE";
};

/**
 * Locations list page. For tests, an optional `items` prop can be supplied to
 * bypass network calls and exercise filtering/sorting locally.
 */
export default function LocationsPage({
  searchParams,
  items = [],
}: {
  searchParams?: Record<string, string | string[] | undefined>;
  items?: LocationListItem[];
}) {
  const [search, setSearch] = useState("");
  // Filters are applied only when the user clicks Apply.
  const [applied, setApplied] = useState<LocationsFilterValues>({ status: "", country: "", company: "" });
  const [pending, setPending] = useState<LocationsFilterValues>({ status: "", country: "", company: "" });

  // Simulated dataset (in real app we'd fetch). Keep stable reference for tests.
  const dataset = items;

  // Applied filter count (non-default only; search is not counted):
  const appliedCount = useMemo(() => {
    let n = 0;
    if (applied.status && applied.status !== "") n += 1; // status explicitly set (ALL/INACTIVE)
    if (applied.country) n += 1;
    if (applied.company) n += 1;
    return n;
  }, [applied]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dataset
      .filter((row) => {
        // Status: default view is Active only when no explicit status is chosen
        if (!applied.status) {
          if (row.status !== "ACTIVE") return false;
        } else if (applied.status === "INACTIVE") {
          if (row.status !== "INACTIVE") return false;
        } else if (applied.status === "ALL") {
          // no-op
        }
        if (applied.country && (row.country ?? "") !== applied.country) return false;
        if (applied.company && (row.company ?? "") !== applied.company) return false;
        if (!term) return true;
        return row.name.toLowerCase().includes(term);
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // A→Z by default
  }, [dataset, search, applied]);

  function handleApply(values: LocationsFilterValues) {
    setApplied(values);
    setPending(values);
  }

  function handleReset() {
    setApplied({ status: "", country: "", company: "" });
    setPending({ status: "", country: "", company: "" });
    setSearch("");
  }

  // Toast when redirected from a successful create (AC-6).
  const showAddedToast = !!(typeof searchParams !== "undefined" && (searchParams["added"] === "1" || searchParams["success"] === "1"));
  const [showToast, setShowToast] = useState(showAddedToast);
  useEffect(() => {
    if (!showToast) return;
    const id = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(id);
  }, [showToast]);

  return (
    <div className="flex flex-col gap-4">
      {showToast && <Toast message="Location added successfully" />}

      <section className="card flex flex-wrap items-start justify-between gap-4 px-7 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Locations</h1>
          <p className="mt-1 text-sm text-ink-soft">Use the search box to find specific locations.</p>
        </div>
        <Link className="btn btn--primary" href="/locations/new">
          <PlusIcon />
          Add Location
        </Link>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 px-7 py-4">
        <form onSubmit={(e) => { e.preventDefault(); /* search applied via state already */ }} role="search" className="relative">
          <label className="sr-only" htmlFor="location-search">Search locations</label>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            <SearchIcon />
          </span>
          <SearchInput id="location-search" value={search} onChange={setSearch} onSearch={(value) => setSearch(value)} />
        </form>

        <div className="flex items-center gap-2">
          <span aria-hidden className="rounded-lg border border-line p-2.5 text-ink-soft"><FilterIcon /></span>
          <LocationsFilterBar
            values={pending}
            appliedCount={appliedCount}
            onChange={setPending}
            onApply={handleApply}
            onReset={handleReset}
          />
        </div>
      </section>

      <section className="card overflow-hidden">
        {filtered.length > 0 ? (
          <LocationsTable locations={filtered} />
        ) : (
          <div className="p-8 text-center text-sm text-ink-soft">No locations found.</div>
        )}
      </section>
    </div>
  );
}
