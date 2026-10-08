import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import LocationDetails from './location-details';
import {
  getActiveCompanies,
  getLocation,
  Location,
  updateLocation,
} from './locations-api';
import { Company } from '@/lib/types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('./locations-api', () => ({
  getActiveCompanies: jest.fn(),
  getLocation: jest.fn(),
  updateLocation: jest.fn(),
}));

const savedLocation: Location = {
  id: 'location-123',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
  name: 'Northstar Distribution Center',
  nameNormalized: 'northstar distribution center',
  description: null,
  status: 'ACTIVE',
  companyId: 'company-123',
  company: null,
  phone: '+14155550138',
  contactPersonName: 'Avery Chen',
  contactPersonPhone: '(510) 555-0148',
  contactPersonEmail: 'avery.chen@example.com',
  addressLine1: '2450 Harbor Bay Parkway',
  addressLine2: 'Building 4, Suite 120',
  country: 'United States',
  stateProvince: 'California',
  city: 'Oakland',
  postalCode: '94607',
};

const activeCompany = {
  id: 'company-123',
  name: 'Northstar Supply Co.',
  isActive: true,
} as Company;

const inactiveCompany = {
  id: 'company-inactive',
  name: 'Inactive Company',
  isActive: false,
} as Company;

function prepareLoadedLocation() {
  jest.mocked(getLocation).mockResolvedValue(savedLocation);
  jest.mocked(getActiveCompanies).mockResolvedValue([activeCompany, inactiveCompany]);
}

beforeEach(() => {
  jest.clearAllMocks();
  prepareLoadedLocation();
});

describe('Edit Location route', () => {
  it('[AC-8] prepopulates saved values including hierarchy and Company', async () => {
    render(<EditLocationPage params={{ id: 'location-123' }} />);

    expect(await screen.findByLabelText(/Location name/)).toHaveValue('Northstar Distribution Center');
    expect(screen.getByLabelText('Company')).toHaveValue('company-123');
    expect(screen.getByRole('option', { name: 'Northstar Supply Co.' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('United States');
    expect(screen.getByRole('combobox', { name: 'State / Province' })).toHaveValue('California');
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue('Oakland');
    expect(screen.getByLabelText('Contact name')).toHaveValue('Avery Chen');
    expect(screen.getByLabelText('Contact email')).toHaveValue('avery.chen@example.com');
    expect(screen.getByLabelText('Contact phone')).toHaveValue('(510) 555-0148');
    expect(screen.getByLabelText('Location phone')).toHaveValue('+14155550138');
    expect(screen.getByLabelText('Street address')).toHaveValue('2450 Harbor Bay Parkway');
    expect(screen.getByLabelText('Address line 2')).toHaveValue('Building 4, Suite 120');
    expect(screen.getByLabelText('Postal code')).toHaveValue('94607');
    expect(screen.getByRole('combobox', { name: 'State / Province' })).toBeEnabled();
    expect(screen.getByRole('combobox', { name: 'City' })).toBeEnabled();
  });

  it('[AC-9] saves the unchanged name and returns to details with confirmation', async () => {
    const user = userEvent.setup();
    jest.mocked(updateLocation).mockResolvedValue(savedLocation);
    render(<EditLocationPage params={{ id: 'location-123' }} />);

    await screen.findByLabelText(/Location name/);
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateLocation).toHaveBeenCalledWith('location-123', expect.objectContaining({
        name: 'Northstar Distribution Center',
        companyId: 'company-123',
      }));
      expect(mockPush).toHaveBeenCalledWith('/locations/location-123?updated=1');
    });

    // The details route displays the confirmation when navigated with updated=1.
    render(<LocationDetails id="location-123" updated />);
    expect(await screen.findByText('Location updated successfully.')).toBeInTheDocument();
  });
});
