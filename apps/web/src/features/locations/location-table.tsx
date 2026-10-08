'use client';

import Link from 'next/link';
import { StatusDot, Truncated } from '@/components/ui';

export interface LocationListRow {
  id: string;
  name: string;
  company: string;
  companyId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  country: string | null;
}

export function LocationTable({ locations }: { locations: LocationListRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table min-w-[600px]">
        <caption className="sr-only">Locations sorted by name A to Z</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort="ascending">Location name <span aria-hidden="true" className="text-brand">↑</span></th>
            <th scope="col">Company</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id} className="border-t border-line hover:bg-canvas">
              <td>
                <Link className="font-medium text-ink hover:text-brand" href={`/locations/${location.id}/edit`}>
                  <Truncated value={location.name} />
                </Link>
              </td>
              <td>{location.company && location.company !== '-' ? <Truncated value={location.company} /> : <span className="text-ink-muted">-</span>}</td>
              <td>
                <span className="inline-flex items-center gap-2">
                  <StatusDot active={location.status === 'ACTIVE'} />
                  {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-right">
                <Link className="text-sm font-medium text-brand hover:underline" href={`/locations/${location.id}/edit`} aria-label={`Edit ${location.name}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
