import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import {
  createLocation,
  getLocationCities,
  getLocationCountries,
  getLocationStates,
  updateLocation,
} from './location-api';
import { LocationForm } from './location-form';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(readonly status: number, message: string) { super(message); }
  },
  apiFetch: jest.fn(),
}));
jest.mock('./location-api', () => ({
  createLocation: jest.fn(),
  getLocationCities: jest.fn(),
  getLocationCountries: jest.fn(),
  getLocationStates: jest.fn(),
  updateLocation: jest.fn(),
}));

const mockedApiFetch = jest.mocked(apiFetch);
const mockCreate = jest.mocked(createLocation);
const mockUpdate = jest.mocked(updateLocation);
const mockCountries = jest.mocked(getLocationCountries);
const mockStates = jest.mocked(getLocationStates);
const mockCities = jest.mocked(getLocationCities);

const saved = {
  id: 'loc-new', name: 'North Clinic', phone: null, companyId: null,
  country: 'United States', stateProvince: 'Illinois', city: 'Springfield',
  isActive: true, createdAt: '', updatedAt: '', createdById: null, updatedById: null,
  message: 'Location added successfully.',
};

function prepareApi() {
  mockCountries.mockResolvedValue(['United States', 'Canada']);
  mockStates.mockImplementation(async (country) => country === 'United States' ? ['Illinois', 'Ohio'] : ['Ontario']);
  mockCities.mockImplementation(async (_country, state) => state === 'Illinois' ? ['Springfield', 'Chicago'] : ['Toronto']);
  mockedApiFetch.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 1000 });
}

beforeEach(() => {
  jest.clearAllMocks();
  prepareApi();
});

afterEach(() => cleanup());

describe('LocationForm', () => {
  it('[AC-7] saves create and edit forms to their detail views and cancels to the correct destination', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue(saved);
    mockUpdate.mockResolvedValue({ ...saved, id: 'loc-edit', message: 'Location updated successfully.' });

    render(<LocationForm mode="create" />);
    await screen.findByRole('option', { name: 'United States' });
    await user.type(screen.getByLabelText('Name'), 'North Clinic');
    await user.selectOptions(screen.getByLabelText('Country'), 'United States');
    await screen.findByRole('option', { name: 'Illinois' });
    await user.selectOptions(screen.getByLabelText('State/Province'), 'Illinois');
    await screen.findByRole('option', { name: 'Springfield' });
    await user.selectOptions(screen.getByLabelText('City'), 'Springfield');
    await user.click(screen.getByRole('button', { name: 'Save location' }));
    expect(await screen.findByText('Location added successfully.')).toBeInTheDocument();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'North Clinic', country: 'United States' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/locations/loc-new'));

    cleanup();
    render(<LocationForm mode="edit" locationId="loc-edit" initialValues={{
      name: 'North Clinic', companyId: '', phone: '', country: 'United States', stateProvince: 'Illinois', city: 'Springfield',
    }} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Location updated successfully.')).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledWith('loc-edit', expect.objectContaining({ name: 'North Clinic' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/locations/loc-edit'));

    cleanup();
    render(<LocationForm mode="create" />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockPush).toHaveBeenCalledWith('/locations');

    cleanup();
    render(<LocationForm mode="edit" locationId="loc-edit" initialValues={{
      name: 'North Clinic', companyId: '', phone: '', country: '', stateProvince: '', city: '',
    }} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockPush).toHaveBeenCalledWith('/locations/loc-edit');
  });

  it('[AC-11] changing geographic parents clears child selections and reloads dependent options', async () => {
    const user = userEvent.setup();
    render(<LocationForm mode="create" />);
    const country = await screen.findByLabelText('Country');
    const state = screen.getByLabelText('State/Province');
    const city = screen.getByLabelText('City');
    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.selectOptions(country, 'United States');
    await screen.findByRole('option', { name: 'Illinois' });
    await user.selectOptions(state, 'Illinois');
    await screen.findByRole('option', { name: 'Springfield' });
    await user.selectOptions(city, 'Springfield');
    await user.selectOptions(country, 'Canada');

    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(city).toBeDisabled();
    await screen.findByRole('option', { name: 'Ontario' });
    await user.selectOptions(state, 'Ontario');
    expect(city).toHaveValue('');
    expect(mockStates).toHaveBeenLastCalledWith('Canada');
    expect(mockCities).toHaveBeenLastCalledWith('Canada', 'Ontario');
  });

  it('[AC-12] uses country, state, and city choices returned by the offline reference API', async () => {
    mockCountries.mockResolvedValue(['API Country']);
    mockStates.mockResolvedValue(['API Province']);
    mockCities.mockResolvedValue(['API City']);
    const user = userEvent.setup();
    render(<LocationForm mode="create" />);

    const country = await screen.findByLabelText('Country');
    expect(screen.getByRole('option', { name: 'API Country' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'United States' })).not.toBeInTheDocument();
    await user.selectOptions(country, 'API Country');
    expect(await screen.findByRole('option', { name: 'API Province' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('State/Province'), 'API Province');
    expect(await screen.findByRole('option', { name: 'API City' })).toBeInTheDocument();
    expect(mockCountries).toHaveBeenCalledTimes(1);
    expect(mockStates).toHaveBeenCalledWith('API Country');
    expect(mockCities).toHaveBeenCalledWith('API Country', 'API Province');
  });
});
