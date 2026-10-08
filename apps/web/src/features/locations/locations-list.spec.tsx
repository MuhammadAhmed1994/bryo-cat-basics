import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { apiFetch } from '@/lib/api';
import { listLocations, LocationRecord } from './location-api';
import { LocationsList } from './locations-list';

jest.mock('./location-api', () => ({ listLocations: jest.fn() }));
jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

const record = (overrides: Partial<LocationRecord> = {}): LocationRecord => ({
  id: 'loc-1',
  name: 'Albany Distribution Center',
  companyId: 'company-1',
  company: { id: 'company-1', name: 'Acme Group' },
  phone: null,
  contactPerson: null,
  contactPersonPhone: null,
  addressLine1: null,
  addressLine2: null,
  country: 'United States',
  stateProvince: null,
  city: null,
  postalCode: null,
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const page = (data: LocationRecord[], perPage = 50) => ({ data, total: data.length, page: 1, perPage });
const listMock = listLocations as jest.MockedFunction<typeof listLocations>;
const apiMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

function setupMocks() {
  listMock.mockImplementation(async (query = {}) => {
    if (query.status === 'ALL' && query.perPage === 100) return page([
      record(),
      record({ id: 'loc-2', companyId: null, company: null, country: 'Canada' }),
    ], 100);
    if (query.search) return query.search.toLowerCase() === 'clinic'
      ? page([record({ name: 'Downtown Clinic' })])
      : page([]);
    if (query.status === 'INACTIVE') return page([record({ status: 'INACTIVE', name: 'Inactive Office' })]);
    if (query.status === 'ALL') return page([
      record(),
      record({ id: 'loc-2', companyId: null, company: null, country: 'Canada' }),
      record({ id: 'loc-3', name: 'Inactive Office', status: 'INACTIVE' }),
    ]);
    return page([record(), record({ id: 'loc-2', name: 'Bristol Service Hub', companyId: null, company: null })]);
  });
  apiMock.mockResolvedValue({
    data: [{ id: 'company-1', name: 'Acme Group' }],
    total: 1,
    page: 1,
    perPage: 100,
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

afterEach(() => jest.restoreAllMocks());

it('[AC-8] defaults to active name-ascending locations with 50 rows and readable company and status cells', async () => {
  render(<LocationsList />);

  expect(await screen.findByRole('link', { name: 'Albany Distribution Center' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Location' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(within(screen.getByRole('table')).getByText('Acme Group')).toBeInTheDocument();
  expect(screen.getByLabelText('No company')).toBeInTheDocument();
  expect(screen.getAllByText('Active')).not.toHaveLength(0);
  expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
  expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACTIVE', sortDir: 'ASC', perPage: 50, page: 1 }));

  fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'ALL' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(await screen.findByRole('link', { name: 'Inactive Office' })).toBeInTheDocument();
  expect(within(screen.getByRole('table')).getByText('Inactive')).toBeInTheDocument();
});

it('[AC-9] trims search, matches names partially without case sensitivity, and shows the exact empty state when unmatched', async () => {
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Albany Distribution Center' });

  const search = screen.getByRole('searchbox', { name: 'Search locations' });
  fireEvent.change(search, { target: { value: '  cLiNiC  ' } });
  fireEvent.submit(screen.getByRole('search'));

  expect(await screen.findByRole('link', { name: 'Downtown Clinic' })).toBeInTheDocument();
  expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'cLiNiC' }));

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search locations' }), { target: { value: ' nowhere ' } });
  fireEvent.submit(screen.getByRole('search'));
  expect(await screen.findByRole('heading', { name: 'No locations found.' })).toBeInTheDocument();
  expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'nowhere' }));
});

it('[AC-10] applies draft status, Country, and Company filters, counts them, and resets to Active defaults', async () => {
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Albany Distribution Center' });

  const status = screen.getByRole('combobox', { name: 'Status' });
  const country = screen.getByRole('combobox', { name: 'Country' });
  const company = screen.getByRole('combobox', { name: 'Company' });
  await screen.findByRole('option', { name: 'Acme Group' });
  fireEvent.change(status, { target: { value: 'INACTIVE' } });
  fireEvent.change(country, { target: { value: 'Canada' } });
  fireEvent.change(company, { target: { value: 'company-1' } });

  // Draft values do not reach the list until Apply is selected.
  expect(listMock).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'INACTIVE', country: 'Canada' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(listMock).toHaveBeenCalledWith(expect.objectContaining({
    status: 'INACTIVE', country: 'Canada', companyId: 'company-1', perPage: 50,
  })));
  expect(screen.getByLabelText('3 applied filters')).toHaveTextContent('3');

  fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));
  await waitFor(() => expect(listMock).toHaveBeenCalledWith(expect.objectContaining({
    status: 'ACTIVE', sortDir: 'ASC', perPage: 50, page: 1,
  })));
  expect(within(screen.getByRole('combobox', { name: 'Status' })).getByRole('option', { name: 'Active' })).toBeInTheDocument();
  expect(screen.getByLabelText('1 applied filter')).toHaveTextContent('1');
});
