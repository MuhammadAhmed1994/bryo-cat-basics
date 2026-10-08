import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm } from './location-form';
import * as locationApi from './location-api';
import { Location } from './location-types';

jest.mock('./location-api', () => ({
  ...jest.requireActual('./location-api'),
  getActiveCompanies: jest.fn(),
  getLocation: jest.fn(),
  createLocation: jest.fn(),
  updateLocation: jest.fn(),
}));

const linkedCompany = { id: 'co-1', name: 'Northstar Logistics', isActive: true };
const savedLocation: Location = {
  id: 'loc-1',
  name: 'Northside Distribution Center',
  phone: '(312) 555-0148',
  contactPersonPhone: '(312) 555-0182',
  country: 'Canada',
  stateProvince: 'Ontario',
  city: 'Toronto',
  status: 'ACTIVE',
  companyId: linkedCompany.id,
  company: linkedCompany,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(locationApi.getActiveCompanies).mockResolvedValue([linkedCompany]);
  jest.mocked(locationApi.getLocation).mockResolvedValue(savedLocation);
});

it('[AC-4] loads saved values and shows an API duplicate-name error while retaining the current name', async () => {
  const user = userEvent.setup();
  jest.mocked(locationApi.updateLocation).mockResolvedValueOnce(savedLocation).mockRejectedValueOnce(
    new locationApi.LocationApiError('A location with this name already exists.', {
      name: 'A location with this name already exists.',
    }),
  );
  render(<LocationForm locationId="loc-1" onCancel={jest.fn()} />);

  const name = await screen.findByLabelText(/Location name/);
  expect(name).toHaveValue(savedLocation.name);
  expect(screen.getByLabelText('Phone')).toHaveValue(savedLocation.phone);
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(locationApi.updateLocation).toHaveBeenCalledWith('loc-1', expect.objectContaining({ name: savedLocation.name })));

  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('A location with this name already exists.')).toBeInTheDocument();
  expect(name).toHaveValue(savedLocation.name);
});

it('[AC-5] changing Country clears State and City and changing State clears City', async () => {
  render(<LocationForm locationId="loc-1" onCancel={jest.fn()} />);
  const country = await screen.findByLabelText('Country');
  const province = screen.getByLabelText('State / Province');
  const city = screen.getByLabelText('City');
  expect(province).toHaveValue('Ontario');
  expect(city).toHaveValue('Toronto');

  fireEvent.change(country, { target: { value: 'United States' } });
  expect(province).toHaveValue('');
  expect(city).toHaveValue('');
  fireEvent.change(province, { target: { value: 'California' } });
  fireEvent.change(city, { target: { value: 'San Francisco' } });
  fireEvent.change(province, { target: { value: 'Nevada' } });
  expect(city).toHaveValue('');
});

it('[AC-12] offers an optional single Company selection and preselects the saved Company', async () => {
  render(<LocationForm locationId="loc-1" onCancel={jest.fn()} />);
  const company = await screen.findByRole('combobox', { name: 'Company, optional single selection' });
  await waitFor(() => expect(company).toHaveValue(linkedCompany.id));
  expect(screen.getByRole('option', { name: linkedCompany.name })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'No Company' })).toBeInTheDocument();
  expect(locationApi.getActiveCompanies).toHaveBeenCalledTimes(1);
});
