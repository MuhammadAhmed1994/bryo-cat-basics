'use client';

import Link from 'next/link';
import { StatusDot, Truncated } from '@/components/ui';

export type LocationsRow = {
  id: string;
  name: string;
  company: string | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export function LocationsTable({ locations }: { locations: LocationsRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table" aria-label="Locations">
        <thead>
          <tr>
            <th scope="col" className="w-[50%]">Name</th>
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
              <td>
                {loc.company ? <Truncated value={loc.company} /> : <span>-</span>}
              </td>
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
