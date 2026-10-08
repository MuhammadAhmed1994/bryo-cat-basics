import { LocationDetail } from '@/features/locations/location-detail';

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  return <LocationDetail id={params.id} />;
}
