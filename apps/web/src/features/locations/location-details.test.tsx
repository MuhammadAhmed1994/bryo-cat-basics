import { render, screen } from '@testing-library/react';
import { LocationDetails } from './location-details';
import { getLocation, Location } from './locations-api';

jest.mock('./locations-api', () => ({
  getLocation: jest.fn(),
}));

const savedLocation: Location = {
  id: 'location-123',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  name: 'Northstar San Francisco',
  description: null,
  status: 'ACTIVE',
  companyId: 'company-123',
  company: { name: 'Northstar Group' } as Location['company'],
  phone: '+1 (415) 555-0138',
  contactPersonName: 'Jordan Lee',
  contactPersonPhone: null,
  contactPersonEmail: 'jordan.lee@northstar.co',
  addressLine1: '425 Market Street',
  addressLine2: null,
  country: 'United States',
  stateProvince: 'California',
  city: 'San Francisco',
  postalCode: '94105',
};

describe('LocationDetails', () => {
  it('[AC-8] presents saved Country, State/Province, City, and Company values', async () => {
    jest.mocked(getLocation).mockResolvedValue(savedLocation);

    render(<LocationDetails id="location-123" />);

    expect(await screen.findByText('Northstar San Francisco')).toBeInTheDocument();
    expect(screen.getByText('Northstar Group')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('94105')).toBeInTheDocument();
  });
});
