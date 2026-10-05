import Link from 'next/link'
import { StatusDot, Truncated } from '@/components/ui'

export interface LocationItem {
  id: string
  name: string
  companyId: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export function LocationsTable({ locations }: { locations: LocationItem[] }) {
  return (
    <table className="w-full table-fixed border-collapse" aria-label="Locations">
      <thead className="bg-canvas">
        <tr className="border-b border-line text-left text-xs font-semibold uppercase text-ink-soft">
          <th className="w-2/5 px-6 py-3">
            <span className="inline-flex items-center gap-1">Name</span>
          </th>
          <th className="w-2/5 px-6 py-3">Company</th>
          <th className="w-1/5 px-6 py-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {locations.map((loc, idx) => (
          <tr
            key={loc.id}
            className={`border-b border-line ${idx % 2 === 1 ? 'bg-zebra' : ''}`}
          >
            <td className="px-6 py-3 align-middle">
              <Link href={`/locations/${loc.id}`} className="text-brand">
                <Truncated value={loc.name} />
              </Link>
            </td>
            <td className="px-6 py-3 align-middle">
              {loc.companyId ? (
                <span className="truncate-cell" title={loc.companyId}>{loc.companyId}</span>
              ) : (
                <span>-</span>
              )}
            </td>
            <td className="px-6 py-3 align-middle">
              <div className="inline-flex items-center gap-2">
                <StatusDot active={loc.status === 'ACTIVE'} />
                <span>{loc.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
