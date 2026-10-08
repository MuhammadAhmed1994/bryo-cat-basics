import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { getLocation, updateLocation } from './location-api';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('./location-api', () => ({
  getLocation: jest.fn(),
  updateLocation: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const location = {
  id: 'loc-42',
  name: 'Northfield Distribution',
  companyId: 'company-7',
  phone: '+1 612 555 0184',
  contactPerson: 'Jordan Lee',
  contactPersonPhone: '+1 612 555 0190',
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
  jest.mocked(getLocation).mockResolvedValue(location);
  jest.mocked(apiFetch).mockResolvedValue({
    data: [{ id: 'company-7', name: 'Acme Group', isActive: true }],
    total: 1,
    page: 1,
    perPage: 25,
  });
});

describe('Edit Location form', () => {
  it('[AC-5] pre-populates current Location, Company association, and address values', async () => {
    render(<EditLocationPage params={{ id: 'loc-42' }} />);

    expect(await screen.findByRole('heading', { name: 'Edit Location' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Location name/)).toHaveValue('Northfield Distribution');
    await waitFor(() => expect(screen.getByLabelText('Company (optional)')).toHaveValue('company-7'));
    expect(screen.getByLabelText('Location phone')).toHaveValue('+1 612 555 0184');
    expect(screen.getByLabelText('Contact person')).toHaveValue('Jordan Lee');
    expect(screen.getByLabelText('Contact person phone')).toHaveValue('+1 612 555 0190');
    expect(screen.getByLabelText('Address line 1')).toHaveValue('4820 Industrial Parkway');
    expect(screen.getByLabelText('Address line 2')).toHaveValue('Building C');
    expect(screen.getByLabelText('Country')).toHaveValue('United States');
    expect(screen.getByLabelText('State/Province')).toHaveValue('Minnesota');
    expect(screen.getByLabelText('City')).toHaveValue('Northfield');
    expect(screen.getByLabelText('Postal code')).toHaveValue('55057');
  });

  it('[AC-7] saves valid changes, returns to Location Details, and supplies the success confirmation', async () => {
    jest.mocked(updateLocation).mockResolvedValue({
      ...location,
      name: 'Northfield Distribution West',
      message: 'Location updated successfully.',
      redirectTo: '/locations/loc-42',
    });
    const user = userEvent.setup();
    render(<EditLocationPage params={{ id: 'loc-42' }} />);

    const name = await screen.findByLabelText(/Location name/);
    await user.clear(name);
    await user.type(name, 'Northfield Distribution West');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(updateLocation).toHaveBeenCalledWith('loc-42', expect.objectContaining({
      name: 'Northfield Distribution West',
      companyId: 'company-7',
      addressLine1: '4820 Industrial Parkway',
      country: 'United States',
      stateProvince: 'Minnesota',
      city: 'Northfield',
    })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(
      '/locations/loc-42?success=Location%20updated%20successfully.',
    ));
  });
});
