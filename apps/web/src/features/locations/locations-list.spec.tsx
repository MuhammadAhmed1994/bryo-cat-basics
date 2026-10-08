import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { Location, listLocations } from './location-api';
import { LocationsList } from './locations-list';
import { LocationsTable } from './locations-table';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: jest.fn(),
  buildQuery: (values: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => value !== undefined && query.set(key, String(value)));
    const encoded = query.toString();
    return encoded ? `?${encoded}` : '';
  },
}));
jest.mock('./location-api', () => ({ listLocations: jest.fn() }));

const company: Company = {
  id: 'company-1', name: 'Acme Group', phone: '', email: null, website: null,
  billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  shippingSameAsBilling: true,
  shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  isActive: true, createdAt: '', updatedAt: '', createdById: null, updatedById: null,
};

function location(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-1', name: 'Albany Distribution Center', companyId: company.id,
    phone: null, contactPerson: null, contactPersonPhone: null,
    addressLine1: null, addressLine2: null, country: 'Canada', stateProvince: null,
    city: null, postalCode: null, status: 'ACTIVE', createdAt: '', updatedAt: '', ...overrides,
  };
}

function paginated<T>(data: T[], total = data.length): Paginated<T> {
  return { data, total, page: 1, perPage: 100 };
}

function mockData() {
  jest.mocked(apiFetch).mockResolvedValue(paginated([company]) as never);
  jest.mocked(listLocations).mockImplementation(async (query) => {
    if (query.status === 'ALL') return paginated([location()]) as Paginated<Location>;
    return { data: [location()], total: 1, page: query.page ?? 1, perPage: query.perPage ?? 50 };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockData();
});

describe('Locations list', () => {
  it('[AC-8] lists active locations alphabetically with 50 rows and readable company and status values', async () => {
    render(<LocationsList />);

    expect(await screen.findByRole('link', { name: 'Albany Distribution Center' })).toHaveAttribute('href', '/locations/location-1');
    expect(screen.getByTitle('Acme Group')).toBeInTheDocument();
    const listedActive = screen.getByRole('row', { name: /Albany Distribution Center/ });
    expect(within(listedActive).getByText('Active')).toBeInTheDocument();
    await waitFor(() => expect(listLocations).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ACTIVE', sortDir: 'ASC', page: 1, perPage: 50,
    })));

    const { unmount } = render(<LocationsTable
      locations={[location(), location({ id: 'location-2', name: 'Closed depot', companyId: null, status: 'INACTIVE' })]}
      companyNames={{ [company.id]: company.name }}
    />);
    const inactiveRow = screen.getByRole('row', { name: /Closed depot/ });
    expect(within(inactiveRow).getByText('Inactive')).toBeInTheDocument();
    expect(within(inactiveRow).getByText('-')).toBeInTheDocument();
    unmount();
  });

  it('[AC-9] trims search input and shows the exact no-match state for partial case-insensitive searches', async () => {
    const user = userEvent.setup();
    jest.mocked(listLocations).mockImplementation(async (query) => {
      if (query.status === 'ALL') return paginated([location()]) as Paginated<Location>;
      if (query.search) return { data: [], total: 0, page: 1, perPage: 50 };
      return { data: [location()], total: 1, page: 1, perPage: 50 };
    });
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Albany Distribution Center' });
    const search = screen.getByRole('searchbox', { name: 'Search locations' });
    await user.type(search, '  aLbAnY  ');
    fireEvent.submit(search.closest('form')!);

    expect(await screen.findByRole('heading', { level: 2, name: 'No locations found.' })).toBeInTheDocument();
    await waitFor(() => expect(listLocations).toHaveBeenCalledWith(expect.objectContaining({ search: 'aLbAnY' })));
  });

  it('[AC-10] applies draft status, Country, and Company filters, counts applied filters, and resets defaults', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Albany Distribution Center' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INACTIVE');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'Canada');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Company' }), company.id);
    expect(screen.getByRole('button', { name: /Filters.*1 applied filters/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(listLocations).toHaveBeenCalledWith(expect.objectContaining({
      status: 'INACTIVE', country: 'Canada', companyId: company.id, page: 1,
    })));
    expect(screen.getByText('3 applied filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
    await waitFor(() => expect(listLocations).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ACTIVE', country: undefined, companyId: undefined, search: undefined, page: 1, perPage: 50,
    })));
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('ACTIVE');
    expect(screen.getByRole('searchbox', { name: 'Search locations' })).toHaveValue('');
  });
});
