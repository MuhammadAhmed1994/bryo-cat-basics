import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import { getLocation, updateLocation } from './location-api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('./location-api', () => ({
  getLocation: jest.fn(),
  updateLocation: jest.fn(),
}));

jest.mock('@/features/locations/company-single-select', () => ({
  CompanySingleSelect: ({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) => (
    <label>
      Company (optional)
      <select aria-label="Company (optional)" value={value ?? ''} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">No Company</option>
        <option value="company-1">Acme Group</option>
      </select>
    </label>
  ),
}));

const location = {
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
  status: 'ACTIVE' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (getLocation as jest.Mock).mockResolvedValue(location);
  (updateLocation as jest.Mock).mockResolvedValue({ ...location, message: 'Location updated successfully.' });
});

it('[AC-5] pre-populates current Location values including Company and address fields', async () => {
  render(<EditLocationPage params={{ id: 'location-1' }} />);

  expect(await screen.findByRole('heading', { name: 'Edit Location' })).toBeInTheDocument();
  expect(screen.getByLabelText(/^Location name/)).toHaveValue('Northfield Distribution');
  expect(screen.getByLabelText('Company (optional)')).toHaveValue('company-1');
  expect(screen.getByLabelText('Location phone')).toHaveValue('(612) 555-0184');
  expect(screen.getByLabelText('Contact Person')).toHaveValue('Jordan Lee');
  expect(screen.getByLabelText('Contact Person phone')).toHaveValue('(612) 555-0100');
  expect(screen.getByLabelText('Address line 1')).toHaveValue('4820 Industrial Parkway');
  expect(screen.getByLabelText('Address line 2')).toHaveValue('Building C');
  expect(screen.getByLabelText('Country')).toHaveValue('United States');
  expect(screen.getByLabelText('State/Province')).toHaveValue('Minnesota');
  expect(screen.getByLabelText('City')).toHaveValue('Northfield');
  expect(screen.getByLabelText('Postal code')).toHaveValue('55057');
});

it('[AC-7] saves valid changes, navigates to Location Details, and includes the success confirmation', async () => {
  const user = userEvent.setup();
  render(<EditLocationPage params={{ id: 'location-1' }} />);
  await screen.findByRole('heading', { name: 'Edit Location' });

  fireEvent.change(screen.getByLabelText(/^Location name/), { target: { value: 'Northfield Distribution Updated' } });
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));

  await waitFor(() => expect(updateLocation).toHaveBeenCalledWith('location-1', expect.objectContaining({
    name: 'Northfield Distribution Updated',
    companyId: 'company-1',
    addressLine1: '4820 Industrial Parkway',
    country: 'United States',
    stateProvince: 'Minnesota',
    city: 'Northfield',
  })));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith(
    '/locations/location-1?success=Location%20updated%20successfully.',
  ));
});
