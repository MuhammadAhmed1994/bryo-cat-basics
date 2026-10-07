import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getLocation, setLocationStatus } from './location-api';
import type { Location } from './location-types';
import { LocationDetails } from './location-details';

jest.mock('./location-api', () => ({
  getLocation: jest.fn(),
  setLocationStatus: jest.fn(),
}));

const mockGetLocation = getLocation as jest.MockedFunction<typeof getLocation>;
const mockSetLocationStatus = setLocationStatus as jest.MockedFunction<typeof setLocationStatus>;

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-1',
    name: 'North Clinic',
    phone: null,
    companyId: null,
    country: 'United States',
    stateProvince: 'Illinois',
    city: 'Springfield',
    isActive: true,
    createdAt: '2024-01-15T12:30:00.000Z',
    updatedAt: '2024-02-20T16:45:00.000Z',
    createdById: 'user-1',
    updatedById: 'user-1',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('[AC-13] displays location fields, status, audit fields and navigation', async () => {
  mockGetLocation.mockResolvedValue(makeLocation());

  render(<LocationDetails id="location-1" />);

  expect(screen.getByRole('status')).toHaveTextContent('Loading location');
  expect(await screen.findByRole('heading', { name: 'North Clinic' })).toBeInTheDocument();
  expect(screen.getByText('Status: Active')).toBeInTheDocument();
  expect(screen.getAllByText('None')).toHaveLength(2);
  expect(screen.getByText('Springfield')).toBeInTheDocument();
  expect(screen.getByText('Illinois')).toBeInTheDocument();
  expect(screen.getByText('United States')).toBeInTheDocument();
  expect(screen.getByText('Jan 15, 2024, 12:30 PM')).toBeInTheDocument();
  expect(screen.getByText('Feb 20, 2024, 4:45 PM')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Back to locations' })[0]).toHaveAttribute(
    'href',
    '/locations',
  );
  expect(screen.getByRole('link', { name: 'Edit location' })).toHaveAttribute(
    'href',
    '/locations/location-1/edit',
  );
});

it('[AC-14] reflects the returned status and announces a successful status change', async () => {
  mockGetLocation.mockResolvedValue(makeLocation());
  mockSetLocationStatus.mockResolvedValue({
    ...makeLocation({ isActive: false, updatedAt: '2024-03-01T10:00:00.000Z' }),
    message: 'Location deactivated successfully.',
  });

  render(<LocationDetails id="location-1" />);
  await screen.findByRole('heading', { name: 'North Clinic' });
  fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

  expect(await screen.findByText('Status: Inactive')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
  expect(await screen.findByRole('status')).toHaveTextContent('Location deactivated successfully.');
  await waitFor(() => {
    expect(mockSetLocationStatus).toHaveBeenCalledWith('location-1', { isActive: false });
  });
});
