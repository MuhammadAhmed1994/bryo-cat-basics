'use client';

export function SearchInput({
  id,
  value,
  onChange,
  onSearch,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSearch(value.trim());
    }
  }

  return (
    <input
      id={id}
      value={value}
      placeholder="Search"
      className="w-72 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
