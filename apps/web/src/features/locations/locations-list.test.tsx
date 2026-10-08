import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsList } from './locations-list';
import { listLocations, type Location } from './locations-api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock('./locations-api', () => ({
  listLocations: jest.fn(),
}));

const mockedListLocations = jest.mocked(listLocations);

function location(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'Alpha Branch',
    nameNormalized: 'alpha branch',
    description: null,
    status: 'ACTIVE',
    companyId: 'company-1',
    company: { id: 'company-1', name: 'Acme Group' } as Location['company'],
    phone: null,
    contactPersonName: null,
    contactPersonPhone: null,
    contactPersonEmail: null,
    addressLine1: null,
    addressLine2: null,
    country: 'Canada',
    stateProvince: null,
    city: null,
    postalCode: null,
    ...overrides,
  };
}

const locations = [
  location({ id: 'a', name: 'Alpha Branch', companyId: null, company: null }),
  location({ id: 'z', name: 'Zulu Depot', companyId: 'company-1', company: { id: 'company-1', name: 'Acme Group' } as Location['company'] }),
];

function makePage(data = locations) {
  return { data, total: data.length, page: 1, perPage: 50 };
}

beforeEach(() => {
  mockedListLocations.mockReset();
  mockedListLocations.mockImplementation(async (params = {}) => {
    const data = params.search?.toLowerCase() === 'missing' ? [] : locations;
    return makePage(data);
  });
});

test('[AC-12] initial list uses Active, name ascending, and 50 rows with required columns and missing Company shown as dash', async () => {
  render(<LocationsList />);

  expect(await screen.findByRole('link', { name: 'Alpha Branch' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Zulu Depot' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Acme Group' })).toBeInTheDocument();
  expect(screen.getAllByText('Active')).toHaveLength(2);
  expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
  await waitFor(() => expect(mockedListLocations).toHaveBeenCalledWith({
    search: '', status: 'ACTIVE', country: undefined, companyId: undefined,
    sortDir: 'ASC', page: 1, perPage: 50,
  }));
});

test('[AC-13] trims search and displays the explicit no-matches message for a case-insensitive partial-name query', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);
  const search = await screen.findByRole('searchbox', { name: 'Search locations by name' });

  await user.type(search, '  MiSsInG  ');
  fireEvent.submit(search.closest('form')!);

  expect(await screen.findByText('No Locations match your search.')).toBeInTheDocument();
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    search: 'MiSsInG', status: 'ACTIVE', sortDir: 'ASC', page: 1, perPage: 50,
  })));
});

test('[AC-14] applies Status, Country, and Company filters and reports the applied filter count', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Alpha Branch' });
  await user.click(screen.getByRole('button', { name: 'Filters, 0 applied filters' }));

  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'INACTIVE');
  await user.type(screen.getByRole('combobox', { name: 'Filter by country' }), 'Canada');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by company' }), 'company-1');

  expect(screen.getByRole('button', { name: 'Filters, 3 applied filters' })).toBeInTheDocument();
  expect(screen.getAllByText('3 filters applied')).toHaveLength(2);
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'INACTIVE', country: 'Canada', companyId: 'company-1', perPage: 50,
  })));
});

test('[AC-15] reset clears search and filters and restores the Active A–Z page-size-50 defaults', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Alpha Branch' });
  await user.type(screen.getByRole('searchbox', { name: 'Search locations by name' }), 'Depot');
  fireEvent.submit(screen.getByRole('searchbox', { name: 'Search locations by name' }).closest('form')!);
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Depot' })));
  await user.click(screen.getByRole('button', { name: /Filters, 0 applied filters/ }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'ALL');
  await user.type(screen.getByRole('combobox', { name: 'Filter by country' }), 'Canada');
  await user.click(screen.getAllByRole('button', { name: 'Reset' })[0]);

  expect(screen.getByRole('searchbox', { name: 'Search locations by name' })).toHaveValue('');
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith({
    search: '', status: 'ACTIVE', country: undefined, companyId: undefined,
    sortDir: 'ASC', page: 1, perPage: 50,
  }));
  expect(screen.getByRole('button', { name: 'Filters, 0 applied filters' })).toBeInTheDocument();
});
