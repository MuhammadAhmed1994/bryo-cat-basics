import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from '../../app/(app)/locations/[id]/edit/page';
import { apiFetch } from '@/lib/api';
import { getLocation, updateLocation } from './location-api';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
  ApiError: jest.requireActual('@/lib/api').ApiError,
}));
jest.mock('./location-api', () => ({
  ...jest.requireActual('./location-api'),
  getLocation: jest.fn(),
  updateLocation: jest.fn(),
}));

const mockedApiFetch = jest.mocked(apiFetch);
const mockedGetLocation = jest.mocked(getLocation);
const mockedUpdateLocation = jest.mocked(updateLocation);

const record = {
  id: 'location-42',
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
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetLocation.mockResolvedValue(record);
  mockedUpdateLocation.mockResolvedValue({ ...record, message: 'Updated' });
  mockedApiFetch.mockResolvedValue({
    data: [{
      id: 'company-1', name: 'Acme Group', isActive: true, phone: '', email: null, website: null,
      billingAddress: {}, shippingAddress: {}, shippingSameAsBilling: true,
      createdAt: '', updatedAt: '', createdById: null, updatedById: null,
    }],
    total: 1, page: 1, perPage: 50,
  } as never);
});

it('[AC-5] pre-populates the existing Location, Company association, contact, and address fields', async () => {
  render(<EditLocationPage params={{ id: 'location-42' }} />);

  expect(screen.getByRole('status')).toHaveTextContent('Loading Location');
  expect(await screen.findByLabelText(/Location name/)).toHaveValue('Northfield Distribution');
  await waitFor(() => expect(screen.getByLabelText('Company (optional)')).toHaveValue('company-1'));
  expect(screen.getByLabelText('Location phone')).toHaveValue('(612) 555-0184');
  expect(screen.getByLabelText('Contact person')).toHaveValue('Jordan Lee');
  expect(screen.getByLabelText('Contact person phone')).toHaveValue('(612) 555-0100');
  expect(screen.getByLabelText('Address line 1')).toHaveValue('4820 Industrial Parkway');
  expect(screen.getByLabelText('Address line 2')).toHaveValue('Building C');
  expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('United States');
  expect(screen.getByRole('combobox', { name: 'State/Province' })).toHaveValue('Minnesota');
  expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue('Northfield');
  expect(screen.getByLabelText('Postal code')).toHaveValue('55057');
});

it('[AC-7] PATCHes valid changes and navigates to Location Details with success confirmation', async () => {
  const user = userEvent.setup();
  render(<EditLocationPage params={{ id: 'location-42' }} />);

  const name = await screen.findByLabelText(/Location name/);
  await user.clear(name);
  await user.type(name, 'Northfield Distribution Updated');
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));

  await waitFor(() => expect(mockedUpdateLocation).toHaveBeenCalledWith('location-42', expect.objectContaining({
    name: 'Northfield Distribution Updated',
    companyId: 'company-1',
    addressLine1: '4820 Industrial Parkway',
    addressLine2: 'Building C',
    country: 'United States',
    stateProvince: 'Minnesota',
    city: 'Northfield',
    postalCode: '55057',
  })));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith(
    '/locations/location-42?success=Location%20updated%20successfully.',
  ));
});
