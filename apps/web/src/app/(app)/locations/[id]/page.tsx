import { LocationDetail } from '@/features/locations/location-detail';

const LOCATION_UPDATED_MESSAGE = 'Location updated successfully.';

interface LocationPageProps {
  params: { id: string };
  searchParams?: { success?: string | string[] };
}

export default function LocationPage({ params, searchParams }: LocationPageProps) {
  const successValues = Array.isArray(searchParams?.success)
    ? searchParams.success
    : [searchParams?.success];
  const showSuccess = successValues.some(
    (value) => value === LOCATION_UPDATED_MESSAGE || value === 'location-updated',
  );

  return <LocationDetail id={params.id} showSuccess={showSuccess} />;
}
