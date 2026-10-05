import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm } from '../location-form';
import { CompanySelect } from '../company-select';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

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
    <LocationForm submitLabel="Save" onSubmit={onSubmit} onCancel={onCancel} />,
  );
  return { onSubmit, onCancel };
}

it('[AC-7] GeoCascadeField disables State until Country and City until State; changing Country clears children', async () => {
  const user = userEvent.setup();
  renderForm();

  const country = screen.getByLabelText('Country');
  const state = screen.getByLabelText('State/Province') as HTMLInputElement;
  const city = screen.getByLabelText('City') as HTMLInputElement;

  expect(state).toBeDisabled();
  expect(city).toBeDisabled();

  await user.type(country, 'Australia');
  expect(screen.getByLabelText('State/Province')).toBeEnabled();
  expect(screen.getByLabelText('City')).toBeDisabled();

  await user.type(screen.getByLabelText('State/Province'), 'New South Wales');
  expect(screen.getByLabelText('City')).toBeEnabled();

  // Changing Country clears State and City per AC-7.
  await user.clear(country);
  await user.type(country, 'Canada');
  expect((screen.getByLabelText('State/Province') as HTMLInputElement).value).toBe('');
  expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('');
});

it('[AC-8] CompanySelect lists only active companies in the searchable single-select', async () => {
  const user = userEvent.setup();
  // Return both active and inactive from the API; the UI must only show active ones.
  const companies: Paginated<Company> = {
    data: [
      {
        id: 'a1',
        name: 'Acme Active',
        phone: '+6100000000',
        email: null,
        website: null,
        billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
        shippingSameAsBilling: true,
        shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
        isActive: true,
        createdAt: '',
        updatedAt: '',
        createdById: null,
        updatedById: null,
      },
      {
        id: 'i1',
        name: 'Dormant Co',
        phone: '+6100000001',
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
      },
    ],
    total: 2,
    page: 1,
    perPage: 50,
  };
  mockApiFetch.mockResolvedValue(companies as never);

  render(
    <div>
      <label htmlFor="company">Company</label>
      <CompanySelect id="company" value={null} onChange={jest.fn()} />
    </div>,
  );

  await user.click(screen.getByLabelText('Company'));
  await user.type(screen.getByLabelText('Company'), 'ac');

  // Only the active company should be present in the option list.
  expect(await screen.findByRole('option', { name: 'Acme Active' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /Dormant Co/ })).not.toBeInTheDocument();
});

it('[AC-10] GET /locations/:id/edit pre-populates all fields including Company and the country/state/city chain; Save is unavailable until prefill completes', async () => {
  const user = userEvent.setup();

  const location = {
    id: 'loc-1',
    name: 'Sydney Office',
    companyId: 'co-1',
    phone: null,
    contactPersonName: null,
    contactPersonPhone: null,
    addressLine1: '42 Harbour Road',
    addressLine2: null,
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Sydney',
    postalCode: '2000',
    status: 'ACTIVE',
  };
  const company: Company = {
    id: 'co-1',
    name: 'Acme Cattle Co.',
    phone: '+61000000000',
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
  };

  mockApiFetch.mockResolvedValueOnce(location as never);
  mockApiFetch.mockResolvedValueOnce(company as never);

  render(<EditLocationPage params={{ id: 'loc-1' }} />);

  expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();

  expect(await screen.findByLabelText('Country')).toHaveValue('Australia');
  expect(screen.getByLabelText('State/Province')).toHaveValue('New South Wales');
  expect(screen.getByLabelText('City')).toHaveValue('Sydney');

  const companyInput = screen.getByLabelText('Company');
  expect(companyInput).toHaveValue('Acme Cattle Co. (inactive)');
});
