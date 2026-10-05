"use client";

import { SearchIcon } from "@/components/icons";

export function SearchInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={id}>
        Search locations
      </label>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
        <SearchIcon />
      </span>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        className="w-72 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
