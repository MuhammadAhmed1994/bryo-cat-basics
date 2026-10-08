import { render, screen } from '@testing-library/react';
import { getLocation, Location } from './location-api';
import { LocationDetail } from './location-detail';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

jest.mock('./location-api', () => ({ getLocation: jest.fn() }));

const mockGetLocation = jest.mocked(getLocation);
const location: Location = {
  id: 'loc-42',
  name: 'Northfield Distribution',
  companyId: 'co-9',
  company: { id: 'co-9', name: 'Acme Group' },
  phone: '(510) 555-0184',
  contactPerson: 'Jordan Lee',
  contactPersonPhone: '(510) 555-0111',
  addressLine1: '2400 Harbor Bay Parkway',
  addressLine2: 'Suite 4',
  country: 'United States',
  stateProvince: 'California',
  city: 'Oakland',
  postalCode: '94621',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  mockGetLocation.mockReset();
  mockGetLocation.mockResolvedValue(location);
  window.history.replaceState({}, '', '/locations/loc-42?success=Location%20updated%20successfully.');
});

it('[AC-7]', async () => {
  render(<LocationDetail id="loc-42" />);

  expect(await screen.findByRole('heading', { name: 'Northfield Distribution' })).toBeInTheDocument();
  expect(screen.getByText('Acme Group')).toBeInTheDocument();
  expect(screen.getByText('(510) 555-0184')).toBeInTheDocument();
  expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  expect(screen.getByText('(510) 555-0111')).toBeInTheDocument();
  expect(screen.getByText('2400 Harbor Bay Parkway')).toBeInTheDocument();
  expect(screen.getByText('Oakland')).toBeInTheDocument();
  expect(screen.getByText('California')).toBeInTheDocument();
  expect(screen.getByText('United States')).toBeInTheDocument();
  expect(screen.getByText('94621')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Location updated successfully.');
  expect(screen.getByRole('link', { name: 'Edit Location' })).toHaveAttribute('href', '/locations/loc-42/edit');
  expect(screen.getByRole('link', { name: 'Back to Locations' })).toHaveAttribute('href', '/locations');
});
