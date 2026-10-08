import { render, screen } from '@testing-library/react';
import { getLocation, LocationRecord } from './location-api';
import { LocationDetail } from './location-detail';

jest.mock('./location-api', () => ({ getLocation: jest.fn() }));
jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error { constructor(readonly status: number, message: string) { super(message); } },
}));

const fixture: LocationRecord = {
  id: 'location-1',
  name: 'Northfield Distribution',
  companyId: 'company-1',
  company: { id: 'company-1', name: 'Acme Group' },
  phone: '(612) 555-0184',
  contactPerson: 'Jordan Lee',
  contactPersonPhone: '(612) 555-0100',
  addressLine1: '4820 Industrial Parkway',
  addressLine2: 'Building C',
  country: 'United States',
  stateProvince: 'Minnesota',
  city: 'Northfield',
  postalCode: '55057',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/locations/location-1?success=Location%20updated%20successfully.');
  (getLocation as jest.Mock).mockResolvedValue(fixture);
});

it('[AC-7]', async () => {
  render(<LocationDetail id="location-1" />);

  expect(await screen.findByRole('heading', { name: 'Location Details' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Northfield Distribution' })).toBeInTheDocument();
  expect(screen.getByText('Acme Group')).toBeInTheDocument();
  expect(screen.getByText('(612) 555-0184')).toBeInTheDocument();
  expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  expect(screen.getByText('(612) 555-0100')).toBeInTheDocument();
  expect(screen.getByText('4820 Industrial Parkway')).toBeInTheDocument();
  expect(screen.getByText('Minnesota')).toBeInTheDocument();
  expect(screen.getByText('Northfield')).toBeInTheDocument();
  expect(screen.getByText('United States')).toBeInTheDocument();
  expect(screen.getByText('55057')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Edit Location' })).toHaveAttribute('href', '/locations/location-1/edit');
  expect(screen.getByRole('link', { name: /Back to Locations/ })).toHaveAttribute('href', '/locations');
  expect(screen.getByRole('status')).toHaveTextContent('Location updated successfully.');
  expect(screen.queryByRole('button', { name: /activate|deactivate/i })).not.toBeInTheDocument();
});
