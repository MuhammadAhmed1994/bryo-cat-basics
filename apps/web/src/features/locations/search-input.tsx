'use client';

import { SearchIcon } from '@/components/icons';

export function SearchInput({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <label className="sr-only" htmlFor="location-search">
        Search locations
      </label>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
        <SearchIcon />
      </span>
      <input
        id="location-search"
        value={value}
        placeholder="Search"
        className="w-72 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
