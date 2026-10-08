import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import type { Location } from './locations-api';
import type { Company } from '@/lib/types';
import { getActiveCompanies, getLocation, updateLocation } from './locations-api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('./locations-api', () => ({
  getLocation: jest.fn(),
  getActiveCompanies: jest.fn(),
  updateLocation: jest.fn(),
}));

const savedLocation: Location = {
  id: 'location-1',
  createdAt: '',
  updatedAt: '',
  name: 'Northstar Distribution Center',
  nameNormalized: 'northstar distribution center',
  description: 'Main distribution facility',
  status: 'ACTIVE',
  companyId: 'company-1',
  company: null,
  phone: '+1 415 555 0100',
  contactPersonName: 'Avery Chen',
  contactPersonPhone: '+1 415 555 0148',
  contactPersonEmail: 'avery@example.com',
  addressLine1: '2450 Harbor Bay Parkway',
  addressLine2: 'Building 4',
  country: 'United States',
  stateProvince: 'California',
  city: 'Oakland',
  postalCode: '94607',
};

const activeCompany: Company = {
  id: 'company-1',
  name: 'Northstar Supply Co.',
  phone: '',
  email: null,
  website: null,
  billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  shippingSameAsBilling: true,
  shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  isActive: true,
  createdAt: '',
  updatedAt: '',
  createdById: null,
  updatedById: null,
};

function setupEditPage() {
  jest.mocked(getLocation).mockResolvedValue(savedLocation);
  jest.mocked(getActiveCompanies).mockResolvedValue([activeCompany]);
  jest.mocked(updateLocation).mockResolvedValue(savedLocation);
  return render(<EditLocationPage params={{ id: savedLocation.id }} />);
}

it('[AC-8] displays saved location, hierarchy, company, contact, and address values', async () => {
  setupEditPage();

  expect(await screen.findByRole('heading', { name: 'Edit Location' })).toBeInTheDocument();
  expect(screen.getByLabelText(/^Location name/)).toHaveValue(savedLocation.name);
  expect(screen.getByLabelText('Country')).toHaveValue('United States');
  expect(screen.getByLabelText('State/Province')).toHaveValue('California');
  expect(screen.getByLabelText('City')).toHaveValue('Oakland');
  expect(screen.getByLabelText('Company')).toHaveDisplayValue('Northstar Supply Co.');
  expect(screen.getByLabelText('Contact name')).toHaveValue('Avery Chen');
  expect(screen.getByLabelText('Contact email')).toHaveValue('avery@example.com');
  expect(screen.getByLabelText('Contact phone')).toHaveValue('+1 415 555 0148');
  expect(screen.getByLabelText('Address line 1')).toHaveValue('2450 Harbor Bay Parkway');
  expect(screen.getByLabelText('Address line 2')).toHaveValue('Building 4');
  expect(screen.getByLabelText('Postal code')).toHaveValue('94607');
});

it('[AC-9] saves the unchanged name and returns to details with the update confirmation marker', async () => {
  const user = userEvent.setup();
  setupEditPage();

  await screen.findByRole('heading', { name: 'Edit Location' });
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));

  await waitFor(() => expect(updateLocation).toHaveBeenCalled());
  expect(updateLocation).toHaveBeenCalledWith(
    'location-1',
    expect.objectContaining({ name: 'Northstar Distribution Center', companyId: 'company-1' }),
  );
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/locations/location-1?updated=1'));
});
