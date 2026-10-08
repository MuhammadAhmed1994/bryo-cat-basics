import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import { getLocation, listActiveCompanies, updateLocation } from './locations-api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('./locations-api', () => ({
  getLocation: jest.fn(),
  listActiveCompanies: jest.fn(),
  updateLocation: jest.fn(),
}));

const savedLocation = {
  id: 'loc-42',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  name: 'Harbor Distribution Center',
  description: 'West coast distribution hub',
  status: 'ACTIVE' as const,
  companyId: 'company-7',
  company: { id: 'company-7', name: 'Harbor Supply' },
  phone: '+1 415 555 0100',
  contactPersonName: 'Avery Chen',
  contactPersonPhone: '+1 415 555 0101',
  contactPersonEmail: 'avery@example.com',
  addressLine1: '2450 Harbor Bay Parkway',
  addressLine2: 'Building 4',
  country: 'United States',
  stateProvince: 'California',
  city: 'Oakland',
  postalCode: '94607',
};

const companyPage = {
  data: [{
    id: 'company-7',
    name: 'Harbor Supply',
    phone: '+1 415 555 0100',
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
  }],
  total: 1,
  page: 1,
  perPage: 100,
};

const mockGetLocation = getLocation as jest.MockedFunction<typeof getLocation>;
const mockListActiveCompanies = listActiveCompanies as jest.MockedFunction<typeof listActiveCompanies>;
const mockUpdateLocation = updateLocation as jest.MockedFunction<typeof updateLocation>;

function renderEditPage() {
  mockGetLocation.mockResolvedValue(savedLocation);
  mockListActiveCompanies.mockResolvedValue(companyPage);
  return render(<EditLocationPage params={{ id: 'loc-42' }} />);
}

it('[AC-8] prepopulates all saved Location, hierarchy, Company, contact, and address values', async () => {
  renderEditPage();

  expect(await screen.findByLabelText(/Location name/)).toHaveValue('Harbor Distribution Center');
  expect(screen.getByLabelText('Company')).toHaveValue('company-7');
  expect(screen.getByLabelText('Contact name')).toHaveValue('Avery Chen');
  expect(screen.getByLabelText('Contact email')).toHaveValue('avery@example.com');
  expect(screen.getByLabelText('Contact phone')).toHaveValue('+1 415 555 0101');
  expect(screen.getByLabelText('Location phone')).toHaveValue('+1 415 555 0100');
  expect(screen.getByLabelText(/^Country/)).toHaveValue('United States');
  expect(screen.getByLabelText(/^State\/Province/)).toHaveValue('California');
  expect(screen.getByLabelText(/^City/)).toHaveValue('Oakland');
  expect(screen.getByLabelText('Address line 1')).toHaveValue('2450 Harbor Bay Parkway');
  expect(screen.getByLabelText('Address line 2')).toHaveValue('Building 4');
  expect(screen.getByLabelText('Postal code')).toHaveValue('94607');
});

it('[AC-9] saves an unchanged name and returns to Location Details with update confirmation', async () => {
  const user = userEvent.setup();
  const mockPush = jest.fn();
  jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push: mockPush });
  mockUpdateLocation.mockResolvedValue(savedLocation);
  renderEditPage();

  await user.click(await screen.findByRole('button', { name: 'Save Changes' }));

  await screen.findByRole('status');
  expect(screen.getByText('Location updated successfully.')).toBeInTheDocument();
  expect(mockUpdateLocation).toHaveBeenCalledWith('loc-42', expect.objectContaining({
    name: 'Harbor Distribution Center',
    companyId: 'company-7',
  }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/locations/loc-42?updated=1'));
});
