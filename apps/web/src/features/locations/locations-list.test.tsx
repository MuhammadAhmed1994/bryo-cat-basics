import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsList } from './locations-list';
import { Location, listLocations } from './locations-api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock('./locations-api', () => ({
  listLocations: jest.fn(),
}));

const company = {
  id: 'company-1',
  name: 'Acme Logistics',
  phone: '+15555550100',
  email: null,
  website: null,
  billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  shippingSameAsBilling: true,
  shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdById: null,
  updatedById: null,
};

const locations: Location[] = [
  {
    id: 'loc-a', createdAt: '', updatedAt: '', name: 'Austin Center', description: null,
    status: 'ACTIVE', companyId: company.id, company, phone: null, contactPersonName: null,
    contactPersonPhone: null, contactPersonEmail: null, addressLine1: null, addressLine2: null,
    country: 'United States', stateProvince: null, city: null, postalCode: null,
  },
  {
    id: 'loc-b', createdAt: '', updatedAt: '', name: 'Denver Warehouse', description: null,
    status: 'ACTIVE', companyId: null, company: null, phone: null, contactPersonName: null,
    contactPersonPhone: null, contactPersonEmail: null, addressLine1: null, addressLine2: null,
    country: 'United States', stateProvince: null, city: null, postalCode: null,
  },
];

const pageResult = {
  data: locations,
  total: locations.length,
  page: 1,
  perPage: 50,
};

const listLocationsMock = jest.mocked(listLocations);

beforeEach(() => {
  jest.clearAllMocks();
  listLocationsMock.mockResolvedValue(pageResult);
});

describe('LocationsList', () => {
  it('[AC-12] loads the active list with default ordering and page size and displays the required columns', async () => {
    render(<LocationsList />);

    expect(await screen.findByRole('link', { name: 'Austin Center' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByText('Acme Logistics')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
    await waitFor(() => expect(listLocationsMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ACTIVE', page: 1, perPage: 50,
    })));
  });

  it('[AC-13] trims search and displays the explicit no-matches state for a partial name query', async () => {
    const user = userEvent.setup();
    listLocationsMock.mockImplementation(async (options) => options?.search
      ? { data: [], total: 0, page: 1, perPage: options.perPage ?? 50 }
      : pageResult);
    render(<LocationsList />);

    const search = screen.getByRole('searchbox', { name: 'Search locations by name' });
    await user.type(search, '  ton  ');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('No Locations match your search.')).toBeInTheDocument();
    await waitFor(() => expect(listLocationsMock).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ton' })));
  });

  it('[AC-14] filters by status, country, and company and reports the applied filter count', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Austin Center' });
    await user.click(screen.getByRole('button', { name: /Filters/ }));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'INACTIVE');
    await user.type(screen.getByRole('textbox', { name: 'Filter by country' }), 'United States');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by company' }), 'company-1');

    expect(screen.getByText('3 filters applied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 3 applied filters' })).toBeInTheDocument();
    await waitFor(() => expect(listLocationsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'INACTIVE', country: 'United States', companyId: 'company-1',
    })));
  });

  it('[AC-15] resets search and filters to active alphabetical results with 50 rows per page', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Austin Center' });
    const search = screen.getByRole('searchbox', { name: 'Search locations by name' });
    await user.type(search, 'Denver');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: /Filters/ }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'ALL');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by company' }), 'company-1');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '100');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('searchbox', { name: 'Search locations by name' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toHaveValue('ACTIVE');
    expect(screen.getByRole('textbox', { name: 'Filter by country' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Filter by company' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
    await waitFor(() => expect(listLocationsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      search: '', status: 'ACTIVE', country: '', companyId: undefined, page: 1, perPage: 50,
    })));
  });
});
