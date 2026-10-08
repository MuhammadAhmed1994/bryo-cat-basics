import LocationDetails from '@/features/locations/location-details';

export default function LocationDetailsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { updated?: string };
}) {
  return <LocationDetails id={params.id} updated={searchParams?.updated === '1'} />;
}
