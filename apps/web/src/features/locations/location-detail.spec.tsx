import { render, screen } from '@testing-library/react';
import { LocationDetail } from './location-detail';
import { getLocation } from './location-api';

jest.mock('./location-api', () => ({ getLocation: jest.fn() }));

const savedLocation = {
  id: 'location-1',
  name: 'Northfield Distribution',
  companyId: 'company-1',
  company: { id: 'company-1', name: 'Acme Group' },
  phone: '(612) 555-0184',
  contactPerson: 'Jordan Lee',
  contactPersonPhone: '(612) 555-0190',
  addressLine1: '4820 Industrial Parkway',
  addressLine2: 'Building C',
  country: 'United States',
  stateProvince: 'Minnesota',
  city: 'Northfield',
  postalCode: '55057',
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (getLocation as jest.Mock).mockResolvedValue(savedLocation);
});

it('[AC-7]', async () => {
  render(<LocationDetail id="location-1" showUpdatedToast />);

  expect(await screen.findByRole('heading', { name: 'Northfield Distribution' })).toBeInTheDocument();
  expect(screen.getByText('Acme Group')).toBeInTheDocument();
  expect(screen.getByText('(612) 555-0184')).toBeInTheDocument();
  expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  expect(screen.getByText('(612) 555-0190')).toBeInTheDocument();
  expect(screen.getByText('4820 Industrial Parkway')).toBeInTheDocument();
  expect(screen.getByText('Building C')).toBeInTheDocument();
  expect(screen.getByText('Northfield')).toBeInTheDocument();
  expect(screen.getByText('Minnesota')).toBeInTheDocument();
  expect(screen.getByText('United States')).toBeInTheDocument();
  expect(screen.getByText('55057')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Location updated successfully.');
  expect(screen.getByRole('link', { name: 'Edit Location' })).toHaveAttribute('href', '/locations/location-1/edit');
  expect(screen.getByRole('link', { name: 'Back to Locations' })).toHaveAttribute('href', '/locations');
});
