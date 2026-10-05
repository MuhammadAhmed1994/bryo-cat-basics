"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";

export function SearchInput({ onSubmit, resetKey }: { onSubmit: (value: string) => void; resetKey?: string }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    // whenever resetKey changes, clear the input (used by Reset Filters)
    setValue("");
  }, [resetKey]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative">
      <label className="sr-only" htmlFor="locations-search">Search locations</label>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
        <SearchIcon />
      </span>
      <input
        id="locations-search"
        value={value}
        placeholder="Search"
        className="w-72 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}
