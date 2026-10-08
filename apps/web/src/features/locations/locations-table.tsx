'use client';

import Link from 'next/link';
import { Location } from './location-api';
import { StatusDot, Truncated } from '@/components/ui';

interface LocationsTableProps {
  locations: Location[];
  companyNames: Record<string, string>;
}

export function LocationsTable({ locations, companyNames }: LocationsTableProps) {
  return (
    <div className="table-wrap overflow-x-auto">
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
            const active = location.status === 'ACTIVE';
            const company = location.companyId ? companyNames[location.companyId] : undefined;
            return (
              <tr key={location.id} className="border-t border-line">
                <td>
                  <Link className="font-medium text-ink hover:text-brand" href={`/locations/${location.id}`}>
                    <Truncated value={location.name} />
                  </Link>
                </td>
                <td>{company ? <Truncated value={company} /> : '-'}</td>
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
