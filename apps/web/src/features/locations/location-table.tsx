'use client';

import Link from 'next/link';
import { Location } from './locations-api';
import { StatusDot } from '@/components/ui';

export function LocationTable({ locations }: { locations: Location[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm" aria-label="Locations">
        <thead className="bg-slate-50 text-xs font-medium text-slate-500">
          <tr>
            <th scope="col" aria-sort="ascending" className="border-y border-line px-6 py-3">
              <span className="inline-flex items-center gap-2">Name <span aria-hidden="true" className="text-brand">↑</span></span>
            </th>
            <th scope="col" className="border-y border-line px-6 py-3">Company</th>
            <th scope="col" className="border-y border-line px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id} className="border-b border-line last:border-0 hover:bg-canvas">
              <td className="px-6 py-4 font-medium text-ink">
                <Link href={`/locations/${location.id}`} className="hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                  {location.name}
                </Link>
              </td>
              <td className="px-6 py-4 text-ink-soft">{location.company?.name || '-'}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-2 text-ink-soft">
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
