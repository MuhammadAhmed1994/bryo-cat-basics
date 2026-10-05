import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm } from '../location-form';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import { apiFetch } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function renderForm() {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  render(
    <LocationForm submitLabel="Save Location" onSubmit={onSubmit} onCancel={onCancel} />,
  );
  return { onSubmit, onCancel };
}

it('[AC-7] disables children until their parent is chosen and clears them when Country changes', async () => {
  const user = userEvent.setup();
  renderForm();

  const country = screen.getByLabelText('Country');
  const state = screen.getByLabelText('State/Province');
  const city = screen.getByLabelText('City');

  expect(state).toBeDisabled();
  expect(city).toBeDisabled();

  await user.type(country, 'Australia');
  expect(screen.getByLabelText('State/Province')).toBeEnabled();
  expect(screen.getByLabelText('City')).toBeDisabled();

  await user.type(screen.getByLabelText('State/Province'), 'New South Wales');
  expect(screen.getByLabelText('City')).toBeEnabled();

  // Changing Country clears State and City and re-disables City until State is chosen again.
  await user.clear(country);
  await user.type(country, 'New Zealand');
  expect(screen.getByLabelText('State/Province')).toHaveValue('');
  expect(screen.getByLabelText('City')).toHaveValue('');
  expect(screen.getByLabelText('City')).toBeDisabled();
});

it('[AC-8] Company combobox lists only active companies (Add and Edit)', async () => {
  const user = userEvent.setup();
  mockApiFetch.mockResolvedValueOnce({
    data: [
      { id: 'a', name: 'Active Co', phone: '', email: null, website: null, billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null }, shippingSameAsBilling: true, shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null }, isActive: true, createdAt: '', updatedAt: '', createdById: null, updatedById: null },
      { id: 'b', name: 'Inactive Co', phone: '', email: null, website: null, billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null }, shippingSameAsBilling: true, shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null }, isActive: false, createdAt: '', updatedAt: '', createdById: null, updatedById: null },
    ],
    total: 2,
    page: 1,
    perPage: 50,
  } as never);

  renderForm();

  const combo = screen.getByLabelText('Company');
  await user.click(combo); // open

  // Active company appears; the inactive one does not.
  expect(await screen.findByRole('button', { name: 'Active Co' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Inactive Co' })).not.toBeInTheDocument();

  // "None" is always present so the association can be cleared to null.
  expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument();
});

it('[AC-10] edit form pre-populates every stored value including Company and geo chain', async () => {
  // First call: GET /locations/:id
  mockApiFetch.mockResolvedValueOnce({
    id: 'loc-1',
    name: 'Sydney Office',
    companyId: 'comp-1',
    phone: '+61 2 9000 0000',
    contactPersonName: 'Dana',
    contactPersonPhone: '+61 412 000 000',
    addressLine1: '42 Harbour Rd',
    addressLine2: null,
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Sydney',
    postalCode: '2000',
    status: 'ACTIVE',
  } as never);

  // Second call: GET /companies/:id for the stored company label
  mockApiFetch.mockResolvedValueOnce({
    id: 'comp-1',
    name: 'Acme Genetics',
    phone: '+61400000000',
    email: null,
    website: null,
    billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    shippingSameAsBilling: true,
    shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    isActive: false,
    createdAt: '',
    updatedAt: '',
    createdById: null,
    updatedById: null,
  } as never);

  render(<EditLocationPage params={{ id: 'loc-1' }} />);

  // Primary should not be present while prefill is in progress.
  expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();

  // After load, every value is pre-populated.
  expect(await screen.findByLabelText(/^Name/)).toHaveValue('Sydney Office');
  expect(screen.getByLabelText('Country')).toHaveValue('Australia');
  expect(screen.getByLabelText('State/Province')).toHaveValue('New South Wales');
  expect(screen.getByLabelText('City')).toHaveValue('Sydney');

  // The stored company appears as the current value; inactive label is surfaced.
  expect(screen.getByLabelText('Company')).toHaveValue('Acme Genetics (inactive)');

  // And the primary action is now on screen (still disabled until something changes).
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
});
