"use client";

import { SearchIcon } from "@/components/icons";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function SearchInput({ value, onChange, onSearch, placeholder = "Search", ariaLabel = "Search" }: SearchInputProps) {
  return (
    <form onSubmit={onSearch} role="search" className="relative mr-auto">
      <label className="sr-only" htmlFor="locations-search">{ariaLabel}</label>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
        <SearchIcon />
      </span>
      <input
        id="locations-search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-80 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}
