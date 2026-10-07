import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createLocation, getCities, getCountries, getStates, updateLocation } from './location-api';
import { LocationForm } from './location-form';
import type { Location } from './location-types';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('./location-api', () => ({
  createLocation: jest.fn(),
  getCities: jest.fn(),
  getCountries: jest.fn(),
  getLocation: jest.fn(),
  getStates: jest.fn(),
  updateLocation: jest.fn(),
}));

const savedLocation: Location = {
  id: 'location-42',
  name: 'North Clinic',
  phone: '555-0100',
  companyId: null,
  country: 'Offline Republic',
  stateProvince: 'Green Province',
  city: 'Example City',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdById: null,
  updatedById: null,
};

const push = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push });
  (getCountries as jest.Mock).mockResolvedValue(['Offline Republic', 'Sample Nation']);
  (getStates as jest.Mock).mockResolvedValue(['Green Province', 'Blue Province']);
  (getCities as jest.Mock).mockResolvedValue(['Example City', 'Second City']);
  (createLocation as jest.Mock).mockResolvedValue({ ...savedLocation, message: 'created' });
  (updateLocation as jest.Mock).mockResolvedValue({ ...savedLocation, message: 'updated' });
});

it('[AC-7] saves locations and routes cancel to the correct destination', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<LocationForm mode="create" />);
  await user.type(screen.getByLabelText('Name'), 'North Clinic');
  await user.type(screen.getByLabelText('Phone'), '555-0100');
  await screen.findByRole('option', { name: 'Offline Republic' });
  await user.selectOptions(screen.getByLabelText('Country'), 'Offline Republic');
  await user.selectOptions(await screen.findByLabelText('State/Province'), 'Green Province');
  await user.selectOptions(await screen.findByLabelText('City'), 'Example City');
  await user.click(screen.getByRole('button', { name: 'Save location' }));

  await waitFor(() => expect(createLocation).toHaveBeenCalledWith(expect.objectContaining({
    name: 'North Clinic', country: 'Offline Republic', stateProvince: 'Green Province', city: 'Example City',
  })));
  expect(await screen.findByRole('status')).toHaveTextContent('Location saved.');
  await waitFor(() => expect(push).toHaveBeenCalledWith('/locations/location-42'));

  unmount();
  render(<LocationForm mode="create" />);
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(push).toHaveBeenLastCalledWith('/locations');
  cleanup();

  render(<LocationForm mode="edit" locationId="location-42" initialLocation={savedLocation} />);
  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), 'North Clinic Updated');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(updateLocation).toHaveBeenCalledWith('location-42', expect.objectContaining({ name: 'North Clinic Updated' })));
  expect(await screen.findByRole('status')).toHaveTextContent('Location updated.');
  await waitFor(() => expect(push).toHaveBeenLastCalledWith('/locations/location-42'));

  cleanup();
  render(<LocationForm mode="edit" locationId="location-42" initialLocation={savedLocation} />);
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(push).toHaveBeenLastCalledWith('/locations/location-42');
});

it('[AC-11] clears child selections when a geographic parent changes', async () => {
  const user = userEvent.setup();
  render(<LocationForm mode="create" />);
  await screen.findByRole('option', { name: 'Offline Republic' });
  await user.selectOptions(screen.getByLabelText('Country'), 'Offline Republic');
  await user.selectOptions(await screen.findByLabelText('State/Province'), 'Green Province');
  await user.selectOptions(await screen.findByLabelText('City'), 'Example City');
  expect(screen.getByLabelText('City')).toHaveValue('Example City');

  await user.selectOptions(screen.getByLabelText('Country'), 'Sample Nation');
  expect(screen.getByLabelText('State/Province')).toHaveValue('');
  expect(screen.getByLabelText('City')).toHaveValue('');
  await waitFor(() => expect(getStates).toHaveBeenLastCalledWith('Sample Nation'));
  await user.selectOptions(await screen.findByLabelText('State/Province'), 'Blue Province');
  await user.selectOptions(await screen.findByLabelText('City'), 'Second City');
  await user.selectOptions(screen.getByLabelText('State/Province'), 'Green Province');
  expect(screen.getByLabelText('City')).toHaveValue('');
  await waitFor(() => expect(getCities).toHaveBeenLastCalledWith('Sample Nation', 'Green Province'));
});

it('[AC-12] uses the API-provided offline geographic reference choices', async () => {
  const user = userEvent.setup();
  render(<LocationForm mode="create" />);
  expect(await screen.findByRole('option', { name: 'Offline Republic' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'United States' })).not.toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText('Country'), 'Offline Republic');
  expect(await screen.findByRole('option', { name: 'Green Province' })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('State/Province'), 'Green Province');
  expect(await screen.findByRole('option', { name: 'Example City' })).toBeInTheDocument();
  expect(getCountries).toHaveBeenCalledTimes(1);
  expect(getStates).toHaveBeenCalledWith('Offline Republic');
  expect(getCities).toHaveBeenCalledWith('Offline Republic', 'Green Province');
});
