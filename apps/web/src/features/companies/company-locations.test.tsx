import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyLocations } from './company-locations';
import CompanyDetailsPage from '@/app/(app)/companies/[id]/page';
import { apiFetch } from '@/lib/api';
import { listLocations } from '@/features/locations/location-api';
import type { Company } from '@/lib/types';
import type { Location, PaginatedLocations } from '@/features/locations/location-types';

const mockPush = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(readonly status: number, message: string) {
      super(message);
    }
  },
  apiFetch: jest.fn(),
}));

jest.mock('@/features/locations/location-api', () => ({
  listLocations: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);
const mockListLocations = jest.mocked(listLocations);

const emptyAddress = {
  line1: null,
  line2: null,
  country: null,
  state: null,
  city: null,
  postalCode: null,
};

const company: Company = {
  id: 'company-123',
  name: 'Acme Genetics',
  phone: '+1 555 0100',
  email: null,
  website: null,
  billingAddress: emptyAddress,
  shippingSameAsBilling: true,
  shippingAddress: emptyAddress,
  isActive: true,
  createdAt: '2025-01-02T12:00:00.000Z',
  updatedAt: '2025-02-03T12:00:00.000Z',
  createdById: null,
  updatedById: null,
};

function makeLocation(id: string, name: string): Location {
  return {
    id,
    name,
    phone: null,
    companyId: company.id,
    country: 'United States',
    stateProvince: null,
    city: null,
    isActive: true,
    createdAt: '2025-01-02T12:00:00.000Z',
    updatedAt: '2025-02-03T12:00:00.000Z',
    createdById: null,
    updatedById: null,
  };
}

function locationPage(data: Location[]): PaginatedLocations {
  return { data, total: data.length, page: 1, perPage: 100 };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockApiFetch.mockResolvedValue(company);
});

describe('Company Details locations', () => {
  it('[AC-15] lists associated locations alphabetically and links to location details', async () => {
    mockListLocations.mockResolvedValue(
      locationPage([makeLocation('z-id', 'Willow Clinic'), makeLocation('a-id', 'Apple Clinic')]),
    );

    render(<CompanyLocations companyId={company.id} />);

    const apple = await screen.findByRole('link', { name: 'Apple Clinic' });
    const willow = screen.getByRole('link', { name: 'Willow Clinic' });
    expect(apple).toHaveAttribute('href', '/locations/a-id');
    expect(willow).toHaveAttribute('href', '/locations/z-id');
    expect(apple.compareDocumentPosition(willow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mockListLocations).toHaveBeenCalledWith({
      companyId: company.id,
      status: 'ALL',
      perPage: 100,
      sortDir: 'ASC',
    });
  });

  it('[AC-16] explains the deletion guard and keeps the company when locations are associated', async () => {
    const user = userEvent.setup();
    mockListLocations.mockResolvedValue(locationPage([makeLocation('loc-id', 'North Clinic')]));

    render(<CompanyDetailsPage params={{ id: company.id }} />);
    expect(await screen.findByRole('heading', { name: company.name })).toBeInTheDocument();
    await screen.findByRole('link', { name: 'North Clinic' });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      screen.getByRole('alert').textContent,
    ).toContain('This company cannot be deleted while associated locations remain.');
    expect(screen.getByRole('heading', { name: company.name })).toBeInTheDocument();
    expect(mockApiFetch).not.toHaveBeenCalledWith(`/companies/${company.id}`, {
      method: 'DELETE',
    });
  });

  it('[AC-17] preserves Company Details through location loading, error retry, and the empty state', async () => {
    const user = userEvent.setup();
    let rejectInitialLoad!: (reason?: unknown) => void;
    const initialRequest = new Promise<PaginatedLocations>((_resolve, reject) => {
      rejectInitialLoad = reject;
    });
    mockListLocations.mockReturnValueOnce(initialRequest);
    mockListLocations.mockResolvedValueOnce(locationPage([]));

    await act(async () => {
      render(<CompanyDetailsPage params={{ id: company.id }} />);
      await Promise.resolve();
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading company locations…');
    expect(screen.getByRole('heading', { name: company.name })).toBeInTheDocument();

    await act(async () => {
      rejectInitialLoad(new Error('locations unavailable'));
    });
    expect(await screen.findByText('Company locations could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: company.name })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText('No locations are associated with this company.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: company.name })).toBeInTheDocument();
    expect(mockListLocations).toHaveBeenCalledTimes(2);
  });
});
