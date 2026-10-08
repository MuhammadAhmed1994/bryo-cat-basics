import Link from 'next/link';
import { ChevronLeftIcon, LocationIcon } from '@/components/icons';
import { LocationForm } from '@/features/locations/location-form';

export default function NewLocationPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-1 py-4 sm:px-4">
      <Link href="/locations" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ChevronLeftIcon /> Back to Locations
      </Link>
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-brand-light text-brand"><LocationIcon /></span>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Add Location</h1>
          <p className="mt-1 text-sm text-ink-soft">Create and associate a location in your workspace.</p>
        </div>
      </header>
      <LocationForm submitLabel="Save Location" />
    </div>
  );
}
