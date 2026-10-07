'use client';

import Link from 'next/link';
import { Location } from './location-api';
import { StatusDot, Truncated } from '@/components/ui';

type ListedLocation = Location & {
  company?: { id?: string; name: string } | null;
  companyName?: string | null;
};

export function LocationsTable({ locations }: { locations: ListedLocation[] }) {
  return (
    <div className="table-wrap">
      <table className="table min-w-[620px]">
        <thead>
          <tr>
            <th scope="col" className="w-[47%]">Location</th>
            <th scope="col" className="w-[35%]">Company</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => {
            const companyName = location.company?.name ?? location.companyName ?? null;
            const active = location.status === 'ACTIVE';
            return (
              <tr key={location.id} className="border-t border-line">
                <td>
                  <Link className="font-medium text-ink hover:text-brand" href={`/locations/${location.id}`}>
                    <Truncated value={location.name} />
                  </Link>
                </td>
                <td>
                  {companyName ? (
                    <Truncated value={companyName} />
                  ) : (
                    <span aria-label="No associated company">-</span>
                  )}
                </td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <StatusDot active={active} />
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
