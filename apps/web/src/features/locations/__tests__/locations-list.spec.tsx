import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/(app)/locations/page';
import { LocationsTable, LocationRow } from '@/features/locations/locations-table';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const push = jest.fn();
const searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

function mockCompanies(list: Array<{ id: string; name: string }>) {
  mockApiFetch.mockImplementation((path: string) => {
    if (path.startsWith('/companies')) {
      return Promise.resolve({ data: list, total: list.length, page: 1, perPage: 50 } as never);
    }
    if (path.startsWith('/locations')) {
      // Default empty page unless the test overrides with mockResolvedValueOnce.
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 } as never);
    }
    return Promise.resolve(undefined as never);
  });
}

describe('Locations List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParams.forEach((_, key) => searchParams.delete(key));
  });

  it('[AC-6] shows the success toast when arriving from create', async () => {
    mockCompanies([]);
    // locations fetch default empty
    searchParams.set('added', '1');

    render(<Page />);

    expect(await screen.findByText('Location added successfully')).toBeInTheDocument();
  });

  it('[AC-15] renders Name, Company (- when none) and Status with dot + text', async () => {
    const rows: LocationRow[] = [
      { id: 'loc1', name: 'Sydney Office', companyName: 'Acme Cattle Co.', status: 'ACTIVE' },
      { id: 'loc2', name: 'Perth Depot', companyName: null, status: 'INACTIVE' },
    ];

    render(<LocationsTable locations={rows} sortDir="ASC" onToggleSort={jest.fn()} />);

    // Table headers
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();

    // Company name shows, and dash when no company
    expect(screen.getByText('Acme Cattle Co.')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();

    // Status indicators: dot (title) + label
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('[AC-18] shows "No locations found." when there are no matches', async () => {
    mockCompanies([]);
    // locations fetch default empty via mockCompanies()

    render(<Page />);

    expect(await screen.findByText('No locations found.')).toBeInTheDocument();
  });

  it('[AC-20] offers Status (All/Inactive), Country and Company filters; Apply re-queries with them', async () => {
    const user = userEvent.setup();
    mockCompanies([
      { id: 'comp-1', name: 'Acme Cattle Co.' },
      { id: 'comp-2', name: 'Globex' },
    ]);

    // First load returns some data
    mockApiFetch.mockImplementationOnce((path: string) => {
      if (path.startsWith('/companies')) {
        return Promise.resolve({ data: [
          { id: 'comp-1', name: 'Acme Cattle Co.' },
          { id: 'comp-2', name: 'Globex' },
        ], total: 2, page: 1, perPage: 50 } as never);
      }
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 } as never);
    });

    render(<Page />);

    // Wait for initial fetch
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText('Status'), 'ALL');
    await user.type(screen.getByLabelText('Country'), 'US');
    await user.selectOptions(screen.getByLabelText('Company'), 'comp-1');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // Find the last /locations call and assert params
    const locationCalls = mockApiFetch.mock.calls.filter(([p]) => String(p).startsWith('/locations'));
    const lastPath = String(locationCalls[locationCalls.length - 1]?.[0] ?? '');
    expect(lastPath).toContain('status=ALL');
    expect(lastPath).toContain('country=US');
    expect(lastPath).toContain('company=comp-1');
  });

  it('[AC-21] Reset Filters clears status, country, company and the search box; returns to default state', async () => {
    const user = userEvent.setup();
    mockCompanies([{ id: 'comp-1', name: 'Acme' }]);

    render(<Page />);

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Search locations'), ' syd ');
    await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE');
    await user.type(screen.getByLabelText('Country'), 'AU');
    await user.selectOptions(screen.getByLabelText('Company'), 'comp-1');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // Now reset (choose the toolbar Reset button if multiple are present)
    const [resetBtn] = screen.getAllByRole('button', { name: 'Reset Filters' });
    await user.click(resetBtn);

    // Search box cleared
    expect(screen.getByLabelText('Search locations')).toHaveValue('');

    // Last locations call has defaults: status ACTIVE, sortDir ASC, perPage 50, no country/company/search
    const locationCalls = mockApiFetch.mock.calls.filter(([p]) => String(p).startsWith('/locations'));
    const lastPath = String(locationCalls[locationCalls.length - 1]?.[0] ?? '');
    expect(lastPath).toContain('status=ACTIVE');
    expect(lastPath).toContain('sortDir=ASC');
    expect(lastPath).toContain('perPage=50');
    expect(lastPath).not.toContain('country=');
    expect(lastPath).not.toContain('company=');
    expect(lastPath).not.toContain('search=');
  });

  it('[AC-22] shows the applied-filter count (0 after Reset; 2 with Country and Company)', async () => {
    const user = userEvent.setup();
    mockCompanies([
      { id: 'comp-1', name: 'Acme' },
      { id: 'comp-2', name: 'Globex' },
    ]);

    render(<Page />);

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

    // Initially 0
    expect(await screen.findByText('Filters (0)')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Country'), 'AU');
    await user.selectOptions(screen.getByLabelText('Company'), 'comp-1');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Filters (2)')).toBeInTheDocument();

    // Reset returns to 0
    const [resetBtn] = screen.getAllByRole('button', { name: 'Reset Filters' });
    await user.click(resetBtn);
    expect(await screen.findByText('Filters (0)')).toBeInTheDocument();
  });
});
