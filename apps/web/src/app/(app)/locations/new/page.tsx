import Link from 'next/link';
import { ChevronLeftIcon } from '@/components/icons';
import { LocationForm } from '@/features/locations/location-form';

export default function NewLocationPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="card flex items-center gap-2 px-5 py-5 sm:px-7">
        <Link href="/locations" aria-label="Back to Locations" className="text-brand">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-xl font-semibold text-brand">Add Location</h1>
      </header>
      <p className="text-sm text-ink-soft">Add a new location and its identifying details.</p>
      <LocationForm />
    </div>
  );
}
