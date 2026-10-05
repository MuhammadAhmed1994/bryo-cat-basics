"use client";

import Link from "next/link";
import { StatusDot, Truncated } from "@/components/ui";
import { SortIcon } from "@/components/icons";
import type { LocationRow } from "@/app/(app)/locations/page";

export function LocationsTable({ rows }: { rows: LocationRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">Locations</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[50%]">
              <button type="button" className="table__sort" aria-label="Sort by name">
                Name
                <SortIcon />
              </button>
            </th>
            <th scope="col" className="w-[30%]">Company</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((loc) => (
            <tr key={loc.id} className="border-t border-line">
              <td>
                <Link className="text-ink hover:text-brand" href={`/locations/${loc.id}`}>
                  <Truncated value={loc.name} />
                </Link>
              </td>
              <td>{loc.companyName?.trim() ? <Truncated value={loc.companyName} /> : '-'}</td>
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
