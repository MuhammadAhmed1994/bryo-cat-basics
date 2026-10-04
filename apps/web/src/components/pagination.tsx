'use client';

/** Spec 2.2.7 — "Showing 1–50 of 438 records", a page-size picker and Prev/Next. */
export const PAGE_SIZES = [25, 50, 100];

interface PaginationProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

/** A short window of page numbers around the current page, as in the reference. */
function pageWindow(page: number, lastPage: number, size = 5): number[] {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), lastPage - size + 1));
  return Array.from({ length: Math.min(size, lastPage) }, (_, i) => start + i);
}

export function Pagination({
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm text-ink-soft">
      <span>
        Showing {first}–{last} of {total} records
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 font-medium text-ink disabled:text-ink-muted"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>

        {pageWindow(page, lastPage).map((number) => (
          <button
            key={number}
            type="button"
            aria-label={`Page ${number}`}
            aria-current={number === page ? 'page' : undefined}
            className={`h-8 w-8 rounded-lg text-sm font-medium ${
              number === page
                ? 'border border-brand text-brand'
                : 'text-ink-soft hover:bg-canvas'
            }`}
            onClick={() => onPageChange(number)}
          >
            {number}
          </button>
        ))}

        <button
          type="button"
          className="rounded-lg px-3 py-1.5 font-medium text-ink disabled:text-ink-muted"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>

      <label>
        <span className="sr-only">Rows per page</span>
        <select
          value={perPage}
          aria-label="Rows per page"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          onChange={(event) => onPerPageChange(Number(event.target.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
