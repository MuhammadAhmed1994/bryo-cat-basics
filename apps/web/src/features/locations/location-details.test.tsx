import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationDetails } from './location-details';
import { apiFetch } from '@/lib/api';
import { getLocation, setLocationStatus } from './location-api';
import type { Location, LocationMutationResponse } from './location-types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(readonly status: number, message: string) {
      super(message);
    }
  },
  apiFetch: jest.fn(),
}));

jest.mock('./location-api', () => ({
  getLocation: jest.fn(),
  setLocationStatus: jest.fn(),
}));

const location: Location = {
  id: 'location-123',
  name: 'North Clinic',
  phone: '+1 555 0100',
  companyId: 'company-123',
  country: 'United States',
  stateProvince: 'Illinois',
  city: 'Springfield',
  isActive: true,
  createdAt: '2025-01-02T12:00:00.000Z',
  updatedAt: '2025-02-03T12:00:00.000Z',
  createdById: null,
  updatedById: null,
};

const mockGetLocation = jest.mocked(getLocation);
const mockSetLocationStatus = jest.mocked(setLocationStatus);
const mockApiFetch = jest.mocked(apiFetch);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetLocation.mockResolvedValue(location);
  mockApiFetch.mockResolvedValue({ name: 'Acme Veterinary' });
});

describe('Location details', () => {
  it('[AC-13] shows location fields, status, audit timestamps, and navigation links', async () => {
    render(<LocationDetails id="location-123" />);

    expect(await screen.findByRole('heading', { name: 'North Clinic' })).toBeInTheDocument();
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument();
    expect(screen.getByText('Acme Veterinary')).toBeInTheDocument();
    expect(screen.getByText('Springfield')).toBeInTheDocument();
    expect(screen.getByText('Illinois')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Status: Active')).toBeInTheDocument();
    expect(screen.getByText('Jan 02, 2025')).toBeInTheDocument();
    expect(screen.getByText('Feb 03, 2025')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to locations' })).toHaveAttribute(
      'href',
      '/locations',
    );
    expect(screen.getByRole('link', { name: 'Edit location' })).toHaveAttribute(
      'href',
      '/locations/location-123/edit',
    );
  });

  it('[AC-14] reflects a successful status response and announces the change', async () => {
    const user = userEvent.setup();
    const deactivated: LocationMutationResponse = {
      ...location,
      isActive: false,
      message: 'Location deactivated successfully.',
    };
    mockSetLocationStatus.mockResolvedValue(deactivated);

    render(<LocationDetails id="location-123" />);
    await screen.findByRole('heading', { name: 'North Clinic' });

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(mockSetLocationStatus).toHaveBeenCalledWith('location-123', { isActive: false });
    expect(await screen.findByText('Status: Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Location deactivated successfully.');
    expect(deactivated.isActive).toBe(false);
  });
});
