'use client';

import Link from 'next/link';
import { Location } from './locations-api';
import { StatusDot, Truncated } from '@/components/ui';
import { SortIcon } from '@/components/icons';

export function LocationTable({ locations }: { locations: Location[] }) {
  return (
    <div className="table-wrap">
      <table className="table" aria-label="Locations">
        <thead>
          <tr>
            <th scope="col" aria-sort="ascending" className="w-[48%]">
              <span className="table__sort">Name <SortIcon /><span className="sr-only">sorted ascending</span></span>
            </th>
            <th scope="col" className="w-[32%]">Company</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id} className="border-t border-line">
              <td>
                <Link className="font-medium text-ink hover:text-brand" href={`/locations/${location.id}`}>
                  <Truncated value={location.name} />
                </Link>
              </td>
              <td>{location.company?.name ? <Truncated value={location.company.name} /> : '-'}</td>
              <td>
                <span className="inline-flex items-center gap-2">
                  <StatusDot active={location.status === 'ACTIVE'} />
                  {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
