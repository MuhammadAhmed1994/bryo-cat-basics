import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch, ApiError } from '@/lib/api';
import { createLocation } from './location-api';
import { LocationForm } from './location-form';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
  ApiError: jest.requireActual('@/lib/api').ApiError,
}));
jest.mock('./location-api', () => ({
  createLocation: jest.fn(),
}));

const mockedApiFetch = jest.mocked(apiFetch);
const mockedCreateLocation = jest.mocked(createLocation);

beforeEach(() => {
  jest.clearAllMocks();
  mockedApiFetch.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50 } as never);
  mockedCreateLocation.mockResolvedValue({} as never);
});

it('[AC-1] accepts the required name and optional Company, contact, phone, and address values', async () => {
  const user = userEvent.setup();
  render(<LocationForm />);

  const name = screen.getByRole('textbox', { name: /Location name/ });
  expect(name).toHaveAttribute('maxLength', '100');
  expect(screen.getByLabelText('Company (optional)')).toBeInTheDocument();
  expect(screen.getByLabelText('Location phone')).toBeInTheDocument();
  expect(screen.getByLabelText('Contact person')).toBeInTheDocument();
  expect(screen.getByLabelText('Contact person phone')).toBeInTheDocument();
  expect(screen.getByLabelText('Address line 1')).toBeInTheDocument();
  expect(screen.getByLabelText('Address line 2')).toBeInTheDocument();
  expect(screen.getByLabelText('Country')).toBeInTheDocument();
  expect(screen.getByLabelText('State/Province')).toBeInTheDocument();
  expect(screen.getByLabelText('City')).toBeInTheDocument();
  expect(screen.getByLabelText('Postal code')).toBeInTheDocument();

  await user.type(name, '  Example Branch  ');
  mockedCreateLocation.mockRejectedValueOnce(new ApiError(422, 'This location name is already in use.'));
  await user.click(screen.getByRole('button', { name: 'Create Location' }));
  await waitFor(() => {
    expect(screen.getAllByRole('alert').some((alert) =>
      alert.textContent === 'This location name is already in use.',
    )).toBe(true);
  });
  expect(name).toHaveValue('  Example Branch  ');
  expect(name).toHaveAttribute('aria-invalid', 'true');

  await user.click(screen.getByRole('button', { name: 'Create Location' }));
  await waitFor(() => expect(mockedCreateLocation).toHaveBeenCalledTimes(2));
  expect(mockedCreateLocation).toHaveBeenLastCalledWith(expect.objectContaining({
    name: 'Example Branch',
    companyId: null,
    phone: null,
    contactPerson: null,
    contactPersonPhone: null,
    addressLine1: null,
    addressLine2: null,
    country: null,
    stateProvince: null,
    city: null,
    postalCode: null,
  }));
});

it('[AC-4] accepts and persists typed geography values, enabling dependents and clearing them when a parent changes', async () => {
  const user = userEvent.setup();
  render(<LocationForm />);

  const country = screen.getByRole('combobox', { name: 'Country' });
  const state = screen.getByRole('combobox', { name: 'State/Province' });
  const city = screen.getByRole('combobox', { name: 'City' });
  expect(state).toBeDisabled();
  expect(city).toBeDisabled();

  await user.type(country, 'Freedonia');
  expect(state).toBeEnabled();
  await user.type(state, 'North District');
  expect(city).toBeEnabled();
  await user.type(city, 'Harbor City');

  await user.clear(country);
  await user.type(country, 'Sylvania');
  expect(state).toBeEnabled();
  expect(state).toHaveValue('');
  expect(city).toBeDisabled();
  expect(city).toHaveValue('');

  await user.type(state, 'West Province');
  await user.type(city, 'Lakeview');
  await user.clear(state);
  expect(city).toBeDisabled();
  expect(city).toHaveValue('');
  await user.type(state, 'West Province');
  await user.type(city, 'Lakeview');
  await user.type(screen.getByRole('textbox', { name: /Location name/ }), 'Typed Geography');
  await user.click(screen.getByRole('button', { name: 'Create Location' }));

  await waitFor(() => expect(mockedCreateLocation).toHaveBeenCalledTimes(1));
  expect(mockedCreateLocation).toHaveBeenCalledWith(expect.objectContaining({
    country: 'Sylvania',
    stateProvince: 'West Province',
    city: 'Lakeview',
  }));
});
