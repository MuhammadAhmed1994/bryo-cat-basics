import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocationList } from './location-list';
import AppLayout from '@/app/(app)/layout';
import { listLocations } from './location-api';
import { apiFetch } from '@/lib/api';

jest.mock('next/navigation', () => ({
  usePathname: () => '/locations',
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
jest.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({
    user: { firstName: 'Casey', lastName: 'User', email: 'casey@example.com' },
    loading: false,
    signOut: jest.fn(),
  }),
}));
jest.mock('@/lib/storage', () => ({ getToken: () => 'test-token' }));
jest.mock('./location-api', () => ({ listLocations: jest.fn() }));
jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: jest.fn(),
}));

const mockList = jest.mocked(listLocations);
const mockApiFetch = jest.mocked(apiFetch);
const locations = [
  {
    id: 'loc-1', name: 'North Clinic', phone: '555-0100', companyId: 'co-1', country: 'Canada',
    stateProvince: 'Ontario', city: 'Toronto', isActive: true, createdAt: '', updatedAt: '',
    createdById: null, updatedById: null,
  },
];

function setupList(data = locations, total = data.length) {
  mockList.mockImplementation(async (params = {}) => ({
    data: params.status === 'ALL' && params.perPage === 1 ? locations : data,
    total: params.status === 'ALL' && params.perPage === 1 ? locations.length : total,
    page: params.page ?? 1,
    perPage: params.perPage ?? 50,
  }));
  mockApiFetch.mockImplementation(async (path) => {
    if (path === '/locations/reference/countries') return ['Canada', 'United States'] as never;
    if (path.startsWith('/companies')) return { data: [{ id: 'co-1', name: 'Northstar' }] } as never;
    return [] as never;
  });
}

beforeEach(() => {
  sessionStorage.clear();
  jest.clearAllMocks();
});

describe('Location list acceptance', () => {
  it('[AC-6] offers navigation to the location list and an add-location route', async () => {
    setupList();
    render(<><AppLayout><div /></AppLayout><LocationList /></>);

    const navItem = screen.getByRole('link', { name: 'Locations' });
    expect(navItem).toHaveAttribute('href', '/locations');
    expect(navItem).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'Locations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add location' })).toHaveAttribute('href', '/locations/new');
  });

  it('[AC-8] defaults to active A–Z pages of 50 and applies filters and pagination criteria', async () => {
    setupList(Array.from({ length: 50 }, (_, index) => ({ ...locations[0], id: `loc-${index}` })), 75);
    render(<LocationList />);

    await screen.findByRole('table');
    await waitFor(() => expect(mockList).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ACTIVE', sortDir: 'ASC', page: 1, perPage: 50,
    })));
    expect(screen.getByLabelText('Status')).toHaveValue('ACTIVE');

    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Canada' } });
    await waitFor(() => expect(mockList).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ACTIVE', country: 'Canada', page: 1, perPage: 50,
    })));
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    await waitFor(() => expect(mockList).toHaveBeenCalledWith(expect.objectContaining({
      country: 'Canada', page: 2, perPage: 50,
    })));
  });

  it('[AC-9] retains criteria in the session and distinguishes empty collection from no matches', async () => {
    setupList([], 0);
    sessionStorage.setItem('nbryo.locations.view', JSON.stringify({
      search: 'missing', status: 'ACTIVE', country: '', companyId: '', page: 1,
    }));
    mockList.mockImplementation(async (params = {}) => ({
      data: [],
      total: params.status === 'ALL' ? 2 : 0,
      page: params.page ?? 1,
      perPage: params.perPage ?? 50,
    }));
    const { unmount } = render(<LocationList />);

    expect(await screen.findByText('No locations match these filters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Search locations')).toHaveValue('missing');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
    expect(sessionStorage.getItem('nbryo.locations.view')).toContain('missing');

    unmount();
    mockList.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50 });
    sessionStorage.clear();
    render(<LocationList />);
    await screen.findByText('No locations');
    expect(screen.getAllByRole('link', { name: 'Add location' }).some(
      (link) => link.getAttribute('href') === '/locations/new',
    )).toBe(true);
  });
});
