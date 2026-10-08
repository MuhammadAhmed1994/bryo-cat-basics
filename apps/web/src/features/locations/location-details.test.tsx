import { render, screen } from '@testing-library/react';
import LocationDetails from './location-details';
import { getLocation } from './locations-api';
import type { Location } from './locations-api';

jest.mock('./locations-api', () => ({
  getLocation: jest.fn(),
}));

const savedLocation: Location = {
  id: 'location-2048',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  name: 'Northstar San Francisco',
  nameNormalized: 'northstar san francisco',
  description: null,
  status: 'ACTIVE',
  companyId: 'company-1',
  company: {
    id: 'company-1',
    name: 'Northstar Group',
    phone: '+14155550100',
    email: null,
    website: null,
    billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    shippingSameAsBilling: true,
    shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
  },
  phone: '+14155550138',
  contactPersonName: 'Jordan Lee',
  contactPersonPhone: '+14155550138',
  contactPersonEmail: 'jordan.lee@northstar.co',
  addressLine1: '425 Market Street',
  addressLine2: null,
  country: 'United States',
  stateProvince: 'California',
  city: 'San Francisco',
  postalCode: '94105',
};

describe('Location details', () => {
  it('[AC-8] presents the saved Country, State/Province, City, and Company values', async () => {
    jest.mocked(getLocation).mockResolvedValue(savedLocation);
    render(<LocationDetails locationId="location-2048" />);

    expect(await screen.findByText('Northstar Group')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
  });
});
