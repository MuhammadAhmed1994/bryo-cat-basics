import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import { getActiveCompanies, getLocation, Location, updateLocation } from './locations-api';
import { Company } from '@/lib/types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('./locations-api', () => ({
  getActiveCompanies: jest.fn(),
  getLocation: jest.fn(),
  updateLocation: jest.fn(),
}));

const savedLocation: Location = {
  id: 'location-123',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  name: 'Northstar Distribution Center',
  description: 'Regional distribution',
  status: 'ACTIVE',
  companyId: 'company-123',
  company: { id: 'company-123', name: 'Northstar Supply Co.' } as Company,
  phone: '(510) 555-0148',
  contactPersonName: 'Avery Chen',
  contactPersonPhone: '(510) 555-0199',
  contactPersonEmail: 'avery@example.com',
  addressLine1: '2450 Harbor Bay Parkway',
  addressLine2: 'Building 4, Suite 120',
  country: 'United States',
  stateProvince: 'California',
  city: 'Oakland',
  postalCode: '94607',
};

const activeCompany = { id: 'company-123', name: 'Northstar Supply Co.', isActive: true } as Company;

function preparePage() {
  const push = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ push } as never);
  jest.mocked(getLocation).mockResolvedValue(savedLocation);
  jest.mocked(getActiveCompanies).mockResolvedValue([activeCompany]);
  jest.mocked(updateLocation).mockResolvedValue(savedLocation);
  return push;
}

it('[AC-8] prepopulates saved hierarchy, Company, contact, and address fields', async () => {
  preparePage();
  render(<EditLocationPage params={{ id: 'location-123' }} />);

  expect(await screen.findByLabelText(/Location name/)).toHaveValue('Northstar Distribution Center');
  expect(screen.getByLabelText('Country')).toHaveValue('United States');
  expect(screen.getByLabelText('State/Province')).toHaveValue('California');
  expect(screen.getByLabelText('City')).toHaveValue('Oakland');
  expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue('company-123');
  expect(screen.getByLabelText('Contact name')).toHaveValue('Avery Chen');
  expect(screen.getByLabelText('Contact email')).toHaveValue('avery@example.com');
  expect(screen.getByLabelText('Contact phone')).toHaveValue('(510) 555-0199');
  expect(screen.getByLabelText('Address line 1')).toHaveValue('2450 Harbor Bay Parkway');
  expect(screen.getByLabelText('Address line 2')).toHaveValue('Building 4, Suite 120');
  expect(screen.getByLabelText('Postal code')).toHaveValue('94607');
});

it('[AC-9] saves an unchanged name and returns to Location Details with update confirmation', async () => {
  const user = userEvent.setup();
  const push = preparePage();
  render(<EditLocationPage params={{ id: 'location-123' }} />);
  await screen.findByLabelText(/Location name/);

  await user.click(screen.getByRole('button', { name: 'Save Changes' }));

  await waitFor(() => {
    expect(updateLocation).toHaveBeenCalledWith('location-123', expect.objectContaining({
      name: 'Northstar Distribution Center',
      companyId: 'company-123',
      country: 'United States',
      stateProvince: 'California',
      city: 'Oakland',
    }));
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Location updated successfully.');
  expect(push).toHaveBeenCalledWith('/locations/location-123?updated=1');
});
