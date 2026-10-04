/** Wordmark drawn inline so the app ships without an image dependency. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline ${className}`} aria-label="Nbryo">
      <span className="relative text-2xl font-bold tracking-tight text-ink">
        n
        <span className="text-ink">bryo</span>
        <span
          aria-hidden="true"
          className="absolute -top-1 left-1 h-2 w-12 rounded-t-full border-t-2 border-red-800"
        />
      </span>
      <span className="ml-0.5 text-[0.6rem] font-semibold text-ink-soft">™</span>
    </span>
  );
}

export function PoweredBy() {
  return (
    <div className="rounded-xl bg-canvas px-4 py-3 text-xs text-ink-soft">
      <p className="m-0">Powered by</p>
      <p className="m-0 mt-0.5 font-semibold text-brand">Cattlytics</p>
    </div>
  );
}
