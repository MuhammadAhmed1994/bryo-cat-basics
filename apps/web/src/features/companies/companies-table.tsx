'use client';

import Link from 'next/link';
import { Company } from '@/lib/types';
import { StatusDot, Truncated } from '@/components/ui';
import { SortIcon } from '@/components/icons';

interface CompaniesTableProps {
  companies: Company[];
  sortDir: 'ASC' | 'DESC';
  onToggleSort: () => void;
}

/** Spec 2.8.7 — Name, Phone, Status; status dot next to the status. */
export function CompaniesTable({ companies, sortDir, onToggleSort }: CompaniesTableProps) {
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
            <th scope="col" className="w-[30%]">
              Phone Number
            </th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-t border-line">
              <td>
                <Link className="text-ink hover:text-brand" href={`/companies/${company.id}`}>
                  <Truncated value={company.name} />
                </Link>
              </td>
              <td>
                <Truncated value={company.phone} />
              </td>
              <td>
                <span className="inline-flex items-center gap-2">
                  <StatusDot active={company.isActive} />
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
