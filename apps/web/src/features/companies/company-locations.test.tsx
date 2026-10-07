import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { apiFetch } from '@/lib/api';
import type { Company } from '@/lib/types';
import type { Location, PaginatedLocations } from '@/features/locations/location-types';
import { listLocations } from '@/features/locations/location-api';
import { CompanyLocations } from './company-locations';
import CompanyDetailsPage from '@/app/(app)/companies/[id]/page';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  apiFetch: jest.fn(),
}));

jest.mock('@/features/locations/location-api', () => ({
  listLocations: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockListLocations = listLocations as jest.MockedFunction<typeof listLocations>;
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-1',
    name: 'North Clinic',
    phone: null,
    companyId: 'company-1',
    country: 'United States',
    stateProvince: 'Illinois',
    city: 'Springfield',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: 'user-1',
    updatedById: 'user-1',
    ...overrides,
  };
}

function makeCompany(overrides: Partial<Company> = {}): Company {
  const address = {
    line1: '1 Farm Road',
    line2: null,
    country: 'Australia',
    state: 'New South Wales',
    city: 'Dubbo',
    postalCode: '2830',
  };
  return {
    id: 'company-1',
    name: 'Acme Genetics',
    phone: '+61400000000',
    email: 'hi@acme.test',
    website: 'https://acme.test',
    billingAddress: address,
    shippingSameAsBilling: true,
    shippingAddress: address,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: 'user-1',
    updatedById: 'user-1',
    ...overrides,
  };
}

function locationPage(data: Location[]): PaginatedLocations {
  return { data, total: data.length, page: 1, perPage: 100 };
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('[AC-15] sorts associated locations alphabetically and links each to its details', async () => {
  mockListLocations.mockResolvedValue(
    locationPage([
      makeLocation({ id: 'location-z', name: 'Willow Farm', isActive: false }),
      makeLocation({ id: 'location-a', name: 'Apple Clinic' }),
      makeLocation({ id: 'location-m', name: 'Meadow Center' }),
    ]),
  );

  render(<CompanyLocations companyId="company-1" onLocationsLoaded={jest.fn()} />);

  const section = screen.getByRole('region', { name: 'Locations' });
  const links = await within(section).findAllByRole('link');
  expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
    'View location: Apple Clinic',
    'View location: Meadow Center',
    'View location: Willow Farm',
  ]);
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/locations/location-a',
    '/locations/location-m',
    '/locations/location-z',
  ]);
});

it('[AC-16] explains the deletion guard and keeps an associated company intact', async () => {
  mockApiFetch.mockResolvedValue(makeCompany() as never);
  mockListLocations.mockResolvedValue(locationPage([makeLocation()]));

  render(<CompanyDetailsPage params={{ id: 'company-1' }} />);

  await screen.findByRole('heading', { name: 'Acme Genetics' });
  await screen.findByRole('link', { name: 'View location: North Clinic' });
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

  expect(
    screen.getByRole('alert').textContent,
  ).toContain('This company cannot be deleted while associated locations remain.');
  expect(screen.getByRole('heading', { name: 'Acme Genetics' })).toBeInTheDocument();
  expect(mockApiFetch).not.toHaveBeenCalledWith('/companies/company-1', { method: 'DELETE' });
});

it('[AC-17] preserves Company Details through location loading, error, retry, and empty states', async () => {
  let rejectInitialLoad: (reason: Error) => void = () => undefined;
  mockApiFetch.mockResolvedValue(makeCompany() as never);
  mockListLocations
    .mockImplementationOnce(
      () =>
        new Promise<PaginatedLocations>((_resolve, reject) => {
          rejectInitialLoad = reject;
        }),
    )
    .mockResolvedValueOnce(locationPage([]));

  render(<CompanyDetailsPage params={{ id: 'company-1' }} />);

  expect(await screen.findByText('Loading company locations…')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Acme Genetics' })).toBeInTheDocument();
  expect(screen.getAllByText('1 Farm Road')).toHaveLength(2);

  rejectInitialLoad(new Error('request failed'));
  expect(await screen.findByText('Company locations could not be loaded.')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Acme Genetics' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('No locations are associated with this company.'))
    .toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Acme Genetics' })).toBeInTheDocument();
  await waitFor(() => expect(mockListLocations).toHaveBeenCalledTimes(2));
});
