import LocationDetails from '@/features/locations/location-details';

export default function LocationDetailsPage({ params }: { params: { id: string } }) {
  return <LocationDetails locationId={params.id} />;
}
