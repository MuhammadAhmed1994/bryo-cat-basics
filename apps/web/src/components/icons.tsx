/** Small stroked icons for the sidebar, inline to avoid an icon dependency. */

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function CalendarIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function EmbryoIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="10" cy="11" r="2.5" />
      <circle cx="15" cy="14" r="1.5" />
    </svg>
  );
}

export function TransferIcon() {
  return (
    <svg {...base}>
      <path d="M4 20 20 4M15 4h5v5" />
      <path d="M9 12 12 15" />
    </svg>
  );
}

export function InventoryIcon() {
  return (
    <svg {...base}>
      <path d="M3 10 12 4l9 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M9 21v-7h6v7" />
    </svg>
  );
}

export function AnimalIcon() {
  return (
    <svg {...base}>
      <path d="M4 7c0 5 2 9 8 9s8-4 8-9" />
      <path d="M4 7 2 4m18 3 2-3" />
      <circle cx="9.5" cy="10" r="0.6" fill="currentColor" />
      <circle cx="14.5" cy="10" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function SemenCodeIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function BreedIcon() {
  return (
    <svg {...base}>
      <path d="M5 21V4l12 3-12 3" />
    </svg>
  );
}

export function CompanyIcon() {
  return (
    <svg {...base}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2" />
    </svg>
  );
}

export function LabIcon() {
  return (
    <svg {...base}>
      <path d="M10 3v6L5 19a1.6 1.6 0 0 0 1.4 2h11.2A1.6 1.6 0 0 0 19 19l-5-10V3" />
      <path d="M9 3h6" />
    </svg>
  );
}

export function LocationIcon() {
  return (
    <svg {...base}>
      <path d="M4 20V8m5 12V8m5 12V8m5 12V8" />
      <path d="M2 8h20M2 14h20" />
    </svg>
  );
}

export function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg {...base} width={16} height={16} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...base} width={16} height={16}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base} width={16} height={16}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function FilterIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
    </svg>
  );
}

export function SortIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <path d="m8 5 0 14M8 5 5 8M8 5l3 3" />
      <path d="M16 19V5m0 14 3-3m-3 3-3-3" />
    </svg>
  );
}

export function CollapseIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M3 6h18M3 12h12M3 18h18" />
    </svg>
  );
}
