import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Company } from '@/lib/types';
import { Location, ListLocationsParams, listActiveCompanies, listLocations } from './locations-api';
import { LocationsList } from './locations-list';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock('./locations-api', () => ({
  listLocations: jest.fn(),
  listActiveCompanies: jest.fn(),
}));

const location: Location = {
  id: 'loc-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  name: 'North Harbor Center',
  description: null,
  status: 'ACTIVE',
  companyId: null,
  company: null,
  phone: null,
  contactPersonName: null,
  contactPersonPhone: null,
  contactPersonEmail: null,
  addressLine1: null,
  addressLine2: null,
  country: 'United States',
  stateProvince: null,
  city: null,
  postalCode: null,
};

const company: Company = {
  id: 'company-1',
  name: 'Harbor Group',
  phone: '',
  email: null,
  website: null,
  billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  shippingSameAsBilling: true,
  shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdById: null,
  updatedById: null,
};

function result(data: Location[] = [location], total = data.length) {
  return { data, total, page: 1, perPage: 50 };
}

const mockListLocations = jest.mocked(listLocations);
const mockListActiveCompanies = jest.mocked(listActiveCompanies);

beforeEach(() => {
  jest.clearAllMocks();
  mockListLocations.mockResolvedValue(result());
  mockListActiveCompanies.mockResolvedValue({ data: [company], total: 1, page: 1, perPage: 100 });
});

describe('Location list acceptance criteria', () => {
  it('[AC-12] loads Active Locations by name ascending with 50 rows and shows required columns', async () => {
    render(<LocationsList />);

    expect(await screen.findByRole('link', { name: 'North Harbor Center' })).toHaveAttribute('href', '/locations/loc-1');
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
    await waitFor(() => expect(mockListLocations).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ACTIVE', sortDir: 'ASC', page: 1, perPage: 50,
    })));
  });

  it('[AC-13] trims name search, matches partial names without case sensitivity, and announces no matches', async () => {
    mockListLocations.mockImplementation(async (params: ListLocationsParams = {}) => {
      const term = (params.search ?? '').toLocaleLowerCase();
      return term && location.name.toLocaleLowerCase().includes(term) ? result() : term ? result([], 0) : result();
    });
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'North Harbor Center' });
    const search = screen.getByRole('searchbox', { name: 'Search locations by name' });

    fireEvent.change(search, { target: { value: '  hArB  ' } });
    expect(await screen.findByRole('link', { name: 'North Harbor Center' })).toBeInTheDocument();
    await waitFor(() => expect(mockListLocations).toHaveBeenCalledWith(expect.objectContaining({ search: 'hArB' })));

    fireEvent.change(search, { target: { value: 'no such place' } });
    expect(await screen.findByText('No Locations match your search.')).toBeInTheDocument();
  });

  it('[AC-14] filters by Status, Country, and Company and reports the applied filter count', async () => {
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'North Harbor Center' });
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'INACTIVE' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Country' }), { target: { value: 'Canada' } });
    await screen.findByRole('option', { name: 'Harbor Group' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Company' }), { target: { value: 'company-1' } });

    expect(screen.getByRole('button', { name: 'Filters, 3 applied filters' })).toBeInTheDocument();
    await waitFor(() => expect(mockListLocations).toHaveBeenCalledWith(expect.objectContaining({
      status: 'INACTIVE', country: 'Canada', companyId: 'company-1',
    })));
  });

  it('[AC-15] Reset clears search and filters and restores Active, name ascending, and page size 50', async () => {
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'North Harbor Center' });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search locations by name' }), { target: { value: '  North  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'ALL' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Country' }), { target: { value: 'Canada' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Company' }), { target: { value: 'company-1' } });

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('searchbox', { name: 'Search locations by name' })).toHaveValue('');
    await waitFor(() => expect(mockListLocations).toHaveBeenCalledWith(expect.objectContaining({
      search: '', status: 'ACTIVE', country: '', companyId: undefined, sortDir: 'ASC', page: 1, perPage: 50,
    })));
    expect(within(screen.getByRole('region', { name: 'Location list' })).getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
  });
});
