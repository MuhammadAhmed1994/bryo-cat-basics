import type { Metadata } from 'next';
import { LocationsList } from '@/features/locations/locations-list';

export const metadata: Metadata = { title: 'Locations' };

export default function LocationsPage() {
  return <LocationsList />;
}
