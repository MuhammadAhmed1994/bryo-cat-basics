"use client";

import Link from "next/link";
import { SortIcon } from "@/components/icons";
import { StatusDot, Truncated } from "@/components/ui";
import type { LocationRow } from "@/app/(app)/locations/page";

interface LocationsTableProps {
  locations: LocationRow[];
  sortDir: "ASC" | "DESC";
  onToggleSort: () => void;
}

export function LocationsTable({ locations, sortDir, onToggleSort }: LocationsTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col" className="w-[45%]">
              <button type="button" className="table__sort" onClick={onToggleSort}>
                Name
                <SortIcon />
                <span className="sr-only">
                  {sortDir === 'ASC' ? 'sorted ascending' : 'sorted descending'}
                </span>
              </button>
            </th>
            <th scope="col" className="w-[30%]">Company</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id} className="border-t border-line">
              <td>
                <Link className="text-ink hover:text-brand" href={`/locations/${loc.id}`}>
                  <Truncated value={loc.name} />
                </Link>
              </td>
              <td>{loc.companyId ? <Truncated value={loc.companyId} /> : '-'}</td>
              <td>
                <span className="inline-flex items-center gap-2">
                  <StatusDot active={loc.status === 'ACTIVE'} />
                  {loc.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
