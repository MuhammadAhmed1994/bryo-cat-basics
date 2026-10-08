import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsList } from './locations-list';
import { listLocations, Location } from './locations-api';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

jest.mock('./locations-api', () => ({
  listLocations: jest.fn(),
}));
jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const company: Company = {
  id: 'company-1', name: 'Acme Logistics', phone: '', email: null, website: null,
  billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  shippingSameAsBilling: true,
  shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
  isActive: true, createdAt: '', updatedAt: '', createdById: null, updatedById: null,
};

function location(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-1', createdAt: '', updatedAt: '', name: 'Austin Headquarters', nameNormalized: 'austin headquarters',
    description: null, status: 'ACTIVE', companyId: null, company: null, phone: null, contactPersonName: null,
    contactPersonPhone: null, contactPersonEmail: null, addressLine1: null, addressLine2: null,
    country: null, stateProvince: null, city: null, postalCode: null, ...overrides,
  };
}

function page(data: Location[] = [location()]): Paginated<Location> {
  return { data, total: data.length, page: 1, perPage: 50 };
}

beforeEach(() => {
  jest.clearAllMocks();
  (listLocations as jest.Mock).mockResolvedValue(page());
  (apiFetch as jest.Mock).mockResolvedValue({ data: [company], total: 1, page: 1, perPage: 100 });
});

describe('Locations list acceptance', () => {
  it('[AC-12] loads the active alphabetic list at page size 50 and displays all required columns', async () => {
    render(<LocationsList />);

    expect(await screen.findByRole('link', { name: 'Austin Headquarters' })).toHaveAttribute('href', '/locations/location-1');
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByText('-', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
    await waitFor(() => expect(listLocations).toHaveBeenCalledWith({
      search: '', status: 'ACTIVE', country: '', companyId: undefined, page: 1, perPage: 50,
    }));
  });

  it('[AC-13] trims the entered partial-name search and presents the explicit no-match state', async () => {
    const user = userEvent.setup();
    (listLocations as jest.Mock).mockImplementation(({ search }: { search: string }) =>
      Promise.resolve(search ? page([]) : page()),
    );
    render(<LocationsList />);

    const search = screen.getByRole('searchbox', { name: 'Search locations by name' });
    await user.type(search, '  AusTiN  ');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { level: 2, name: 'No Locations match your search.' })).toBeInTheDocument();
    await waitFor(() => expect(listLocations).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'AusTiN' })));
  });

  it('[AC-14] filters by status, country, and company and announces the number of applied filters', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Austin Headquarters' });
    await user.click(screen.getByRole('button', { name: /Filters/ }));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'INACTIVE');
    await user.type(screen.getByRole('textbox', { name: 'Filter by country' }), 'Canada');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by company' }), 'company-1');

    expect(screen.getByRole('button', { name: 'Filters, 3 applied filters' })).toBeInTheDocument();
    expect(screen.getByText('3 filters applied')).toBeInTheDocument();
    expect(screen.getByText('Country: Canada')).toBeInTheDocument();
    await waitFor(() => expect(listLocations).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'INACTIVE', country: 'Canada', companyId: 'company-1',
    })));
  });

  it('[AC-15] reset clears search and filters and restores Active, A–Z and page size 50 defaults', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Austin Headquarters' });
    await user.type(screen.getByRole('searchbox', { name: 'Search locations by name' }), 'Denver');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: /Filters/ }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'ALL');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('searchbox', { name: 'Search locations by name' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Filters, 1 applied filters' })).toBeInTheDocument();
    await waitFor(() => expect(listLocations).toHaveBeenLastCalledWith({
      search: '', status: 'ACTIVE', country: '', companyId: undefined, page: 1, perPage: 50,
    }));
  });
});
