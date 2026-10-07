import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { listLocations } from './location-api';
import { LocationsList } from './locations-list';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
jest.mock('./location-api', () => ({ listLocations: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

const company = { id: 'company-1', name: 'Acme Group' };

function location(overrides: Record<string, unknown> = {}) {
  return {
    id: 'location-1',
    name: 'Northfield Distribution',
    companyId: company.id,
    phone: null,
    contactPerson: null,
    contactPersonPhone: null,
    addressLine1: null,
    addressLine2: null,
    country: 'Canada',
    stateProvince: null,
    city: null,
    postalCode: null,
    status: 'ACTIVE' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function page(data = [location()]) {
  return { data, total: data.length, page: 1, perPage: 50 };
}

beforeEach(() => {
  jest.clearAllMocks();
  (listLocations as jest.Mock).mockResolvedValue(page());
  (apiFetch as jest.Mock).mockResolvedValue({ data: [company], total: 1, page: 1, perPage: 100 });
});

it('[AC-8] initially requests Active Locations sorted A–Z with 50 records and shows the Location, Company, and readable status', async () => {
  render(<LocationsList />);

  await waitFor(() => expect(listLocations).toHaveBeenCalledWith(expect.objectContaining({
    status: 'ACTIVE',
    sortDir: 'ASC',
    page: 1,
    perPage: 50,
  })));

  expect(await screen.findByRole('link', { name: 'Northfield Distribution' })).toBeInTheDocument();
  expect(screen.getByText('Acme Group')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Location' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
});

it('[AC-9] trims the search value and shows the required no-match message for case-insensitive partial search', async () => {
  const user = userEvent.setup();
  (listLocations as jest.Mock).mockImplementation((params) =>
    Promise.resolve(params.search ? page([]) : page()),
  );
  render(<LocationsList />);
  await waitFor(() => expect(listLocations).toHaveBeenCalled());

  await user.type(screen.getByRole('searchbox', { name: 'Search locations' }), '  NORTH  ');
  fireEvent.submit(screen.getByRole('search'));

  await waitFor(() => expect(listLocations).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'NORTH' })));
  expect(await screen.findByRole('heading', { name: 'No locations found.' })).toBeInTheDocument();
});

it('[AC-10] applies draft status, Country, and Company filters, counts applied filters, and resets to Active defaults', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);
  await waitFor(() => expect(listLocations).toHaveBeenCalled());
  expect(screen.getByLabelText('1 applied filters')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Filters/ }));
  await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE');
  await user.selectOptions(screen.getByLabelText('Country'), 'Canada');
  await user.selectOptions(screen.getByLabelText('Company'), company.id);
  expect(listLocations).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(listLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'INACTIVE', country: 'Canada', companyId: company.id, page: 1,
  })));
  expect(screen.getByLabelText('3 applied filters')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
  await waitFor(() => expect(listLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'ACTIVE', country: undefined, companyId: undefined, search: undefined, page: 1, perPage: 50,
  })));
  expect(screen.getByLabelText('1 applied filters')).toBeInTheDocument();
});
