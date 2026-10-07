import { LocationDetail } from '@/features/locations/location-detail';

interface LocationDetailPageProps {
  params: { id: string };
  searchParams?: { success?: string | string[] };
}

export default function LocationDetailPage({ params, searchParams }: LocationDetailPageProps) {
  const success = Array.isArray(searchParams?.success)
    ? searchParams.success[0]
    : searchParams?.success;

  return (
    <LocationDetail
      id={params.id}
      showUpdatedToast={success === 'Location updated successfully.'}
    />
  );
}
