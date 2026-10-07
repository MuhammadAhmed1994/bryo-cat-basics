import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import AppLayout from '@/app/(app)/layout';
import { useAuth } from '@/features/auth/auth-context';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { getCountries, listLocations } from './location-api';
import { Location, PaginatedLocations } from './location-types';
import { LocationList } from './location-list';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('@/features/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {},
}));
jest.mock('./location-api', () => ({
  getCountries: jest.fn(),
  listLocations: jest.fn(),
}));

const mockedListLocations = jest.mocked(listLocations);
const mockedGetCountries = jest.mocked(getCountries);
const mockedApiFetch = jest.mocked(apiFetch);

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-1',
    name: 'North Clinic',
    phone: '(217) 555-0184',
    companyId: 'company-1',
    country: 'United States',
    stateProvince: 'Illinois',
    city: 'Springfield',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
    ...overrides,
  };
}

function makePage(page = 1, total = 100, data: Location[] = [makeLocation()]): PaginatedLocations {
  return { data, total, page, perPage: 50 };
}

function makeCompanyPage(): Paginated<Company> {
  const noAddress = { line1: null, line2: null, country: null, state: null, city: null, postalCode: null };
  return {
    data: [{
      id: 'company-7', name: 'Company Seven', phone: '', email: null, website: null,
      billingAddress: noAddress, shippingSameAsBilling: true, shippingAddress: noAddress,
      isActive: true, createdAt: '', updatedAt: '', createdById: null, updatedById: null,
    }],
    total: 1,
    page: 1,
    perPage: 100,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  mockedGetCountries.mockResolvedValue(['United States', 'Canada']);
  mockedApiFetch.mockResolvedValue(makeCompanyPage());
  mockedListLocations.mockImplementation(async (params) => makePage(params?.page ?? 1));
  (useAuth as jest.Mock).mockReturnValue({
    user: { firstName: 'Alex', lastName: 'Morgan', email: 'alex@example.com' },
    loading: false,
    signOut: jest.fn(),
  });
  (usePathname as jest.Mock).mockReturnValue('/locations');
});

afterEach(() => {
  jest.clearAllMocks();
});

test('[AC-6] Locations navigation and add action open their location routes', async () => {
  render(
    <AppLayout>
      <LocationList />
    </AppLayout>,
  );

  const navLink = screen.getByRole('link', { name: 'Locations' });
  expect(navLink).toHaveAttribute('href', '/locations');
  expect(navLink).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Add location' })).toHaveAttribute('href', '/locations/new');
  expect(await screen.findByText('North Clinic')).toBeInTheDocument();
});

test('[AC-8] location results default to active A–Z pages and criteria reset pagination', async () => {
  const user = userEvent.setup();
  render(<LocationList />);

  await waitFor(() => expect(mockedListLocations).toHaveBeenCalledWith(expect.objectContaining({
    status: 'ACTIVE', page: 1, perPage: 50, sortDir: 'ASC',
  })));
  expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('ACTIVE');
  expect(await screen.findByText('Showing 1–50 of 100 records')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Page 2' }));
  await waitFor(() => expect(mockedListLocations).toHaveBeenCalledWith(expect.objectContaining({
    status: 'ACTIVE', page: 2, perPage: 50, sortDir: 'ASC',
  })));

  await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INACTIVE');
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'INACTIVE', page: 1, perPage: 50, sortDir: 'ASC',
  })));

  await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'Canada');
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'INACTIVE', country: 'Canada', page: 1,
  })));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Company' }), 'company-7');
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    status: 'INACTIVE', country: 'Canada', companyId: 'company-7', page: 1,
  })));

  const search = screen.getByRole('searchbox', { name: 'Search locations' });
  await user.type(search, 'Springfield');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(mockedListLocations).toHaveBeenLastCalledWith(expect.objectContaining({
    search: 'Springfield', status: 'INACTIVE', country: 'Canada', companyId: 'company-7', page: 1,
  })));
});

test('[AC-9] retained criteria and separate filtered-empty and no-location states are shown', async () => {
  window.sessionStorage.setItem('nbryo.locations.view', JSON.stringify({
    search: 'needle', status: 'INACTIVE', country: 'Canada', companyId: 'company-7', page: 4,
  }));
  let collectionHasLocations = true;
  mockedListLocations.mockImplementation(async (params) => {
    if (params?.status === 'ALL' && !params.search && !params.country && !params.companyId) {
      return makePage(1, collectionHasLocations ? 5 : 0, []);
    }
    return makePage(1, 0, []);
  });
  const user = userEvent.setup();
  render(<LocationList />);

  expect(await screen.findByRole('heading', { name: 'No locations match these filters.' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: 'Search locations' })).toHaveValue('needle');
  expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('INACTIVE');
  expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('Canada');
  expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue('company-7');
  expect(JSON.parse(window.sessionStorage.getItem('nbryo.locations.view') ?? '{}')).toMatchObject({
    search: 'needle', status: 'INACTIVE', country: 'Canada', companyId: 'company-7',
  });

  collectionHasLocations = false;
  await user.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(await screen.findByRole('heading', { name: 'No locations' })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Add location' }).every((link) => link.getAttribute('href') === '/locations/new')).toBe(true);
});
