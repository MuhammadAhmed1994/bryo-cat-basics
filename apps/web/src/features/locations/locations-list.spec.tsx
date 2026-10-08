import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Paginated } from '@/lib/types';
import { listLocations, Location } from './location-api';
import { LocationsList } from './locations-list';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock('./location-api', () => ({
  listLocations: jest.fn(),
}));

const mockListLocations = jest.mocked(listLocations);
const rows = [
  {
    id: 'a', name: 'Albany Center', companyId: 'co-1', company: { id: 'co-1', name: 'Acme Group' },
    phone: null, contactPerson: null, contactPersonPhone: null, addressLine1: null, addressLine2: null,
    country: 'United States', stateProvince: null, city: null, postalCode: null, status: 'ACTIVE',
    createdAt: '', updatedAt: '',
  },
  {
    id: 'b', name: 'Bay Warehouse', companyId: null, company: null,
    phone: null, contactPerson: null, contactPersonPhone: null, addressLine1: null, addressLine2: null,
    country: 'Canada', stateProvince: null, city: null, postalCode: null, status: 'ACTIVE',
    createdAt: '', updatedAt: '',
  },
] as Location[];

function response(data: Location[] = rows): Paginated<Location> {
  return { data, total: data.length, page: 1, perPage: 50 };
}

beforeEach(() => {
  mockListLocations.mockReset();
  mockListLocations.mockResolvedValue(response());
});

it('[AC-8] initially loads active locations in ascending name order at page size 50 and displays location, company, and readable status', async () => {
  render(<LocationsList />);

  expect(await screen.findByRole('link', { name: 'Albany Center' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Location' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('table').querySelector('tbody tr td:nth-child(2)')).toHaveTextContent('Acme Group');
  expect(screen.getByLabelText('No company')).toHaveTextContent('-');
  expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
  expect(mockListLocations).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACTIVE', sortDir: 'ASC', page: 1, perPage: 50 }));
});

it('[AC-9] trims search and matches names partially without regard to case, showing the required empty state for no matches', async () => {
  const user = userEvent.setup();
  mockListLocations.mockImplementation(async (query) => {
    if (query.search) return response([]);
    return response();
  });
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Albany Center' });

  const search = screen.getByRole('searchbox', { name: 'Search locations' });
  await user.type(search, '  bAy  ');
  fireEvent.submit(search.closest('form')!);

  expect(await screen.findByRole('heading', { name: 'No locations found.' })).toBeInTheDocument();
  expect(mockListLocations).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'bAy' }));
});

it('[AC-10] applies draft status, Country, and Company filters, shows applied count, and Reset Filters restores defaults', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Albany Center' });

  await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INACTIVE');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'United States');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Company' }), 'co-1');
  expect(mockListLocations).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Apply' }));

  await waitFor(() => expect(mockListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'INACTIVE', country: 'United States', companyId: 'co-1',
  })));
  expect(screen.getByLabelText('3 applied filters')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
  await waitFor(() => expect(mockListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'ACTIVE', country: undefined, companyId: undefined, search: undefined, page: 1, perPage: 50,
  })));
  expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('ACTIVE');
});
