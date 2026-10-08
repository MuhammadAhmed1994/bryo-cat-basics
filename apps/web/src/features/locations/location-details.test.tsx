import { render, screen } from '@testing-library/react';
import { ApiError } from '@/lib/api';
import { getLocation, Location } from './locations-api';
import { LocationDetails } from './location-details';

jest.mock('./locations-api', () => ({
  ...jest.requireActual('./locations-api'),
  getLocation: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const savedLocation: Location = {
  id: 'location-42',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  name: 'Northstar San Francisco',
  description: null,
  status: 'ACTIVE',
  companyId: 'company-7',
  company: { id: 'company-7', name: 'Northstar Group' },
  phone: '+1 415 555 0138',
  contactPersonName: 'Jordan Lee',
  contactPersonPhone: null,
  contactPersonEmail: 'jordan@northstar.example',
  addressLine1: '425 Market Street',
  addressLine2: null,
  country: 'United States',
  stateProvince: 'California',
  city: 'San Francisco',
  postalCode: '94105',
};

describe('LocationDetails', () => {
  it('[AC-8] presents the saved address hierarchy and Company values', async () => {
    jest.mocked(getLocation).mockResolvedValue(savedLocation);

    render(<LocationDetails id="location-42" />);

    expect(await screen.findByText('Northstar San Francisco')).toBeInTheDocument();
    expect(screen.getByText('Northstar Group')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
