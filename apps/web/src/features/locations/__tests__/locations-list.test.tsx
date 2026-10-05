import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationsPage from '@/app/(app)/locations/page';
import { apiFetch } from '@/lib/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function paged(data: any[]) {
  return { data, total: data.length, page: 1, perPage: 50 };
}

describe('Locations List page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    // default empty list for safety
    mockApiFetch.mockResolvedValue(paged([]) as never);
    window.history.pushState({}, '', '/locations');
  });

  it('[AC-6] shows a success toast when arriving after create', async () => {
    window.history.pushState({}, '', '/locations?added=1');
    render(<LocationsPage />);

    expect(await screen.findByRole('status')).toHaveTextContent('Location added successfully');
  });

  it('[AC-15] renders Name, Company and Status with a dot and label; company shows "-" when none', async () => {
    mockApiFetch.mockResolvedValueOnce(
      paged([
        { id: 'loc-1', name: 'Sydney Office', status: 'ACTIVE', companyId: null },
        { id: 'loc-2', name: 'North Depot', status: 'INACTIVE', companyId: 'comp-1' },
      ]) as never,
    );

    render(<LocationsPage />);

    // Columns
    expect(await screen.findByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();

    // Company missing renders '-'
    expect(screen.getAllByText('-')[0]).toBeInTheDocument();

    // Status dot + label
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Inactive')).toBeInTheDocument();
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
  });

  it('[AC-18] shows "No locations found." when search/filters return no rows', async () => {
    render(<LocationsPage />);
    expect(await screen.findByText('No locations found.')).toBeInTheDocument();
  });

  it('[AC-20] offers Status (All/Inactive), Country and Company filters and Apply re-queries with them', async () => {
    const user = userEvent.setup();

    render(<LocationsPage />);

    const status = await screen.findByLabelText('Status');
    await user.selectOptions(status, 'Inactive');

    await user.type(screen.getByLabelText('Country'), 'Australia');
    await user.type(screen.getByLabelText('Company'), 'comp-123');

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    const url = (mockApiFetch.mock.calls.at(-1)?.[0] as string) || '';
    expect(url).toContain('/locations');
    expect(url).toContain('status=INACTIVE');
    expect(url).toContain('country=Australia');
    expect(url).toContain('company=comp-123');
  });

  it('[AC-21] Reset Filters clears status, country, company and the search box and returns defaults (Active, A→Z, 50)', async () => {
    const user = userEvent.setup();

    render(<LocationsPage />);

    // Apply some filters and a search term
    await user.type(screen.getByLabelText('Search locations'), 'syd');
    await user.keyboard('{Enter}');

    await user.selectOptions(screen.getByLabelText('Status'), 'Inactive');
    await user.type(screen.getByLabelText('Country'), 'NZ');
    await user.type(screen.getByLabelText('Company'), 'comp-9');

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // Now reset
    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    const url = (mockApiFetch.mock.calls.at(-1)?.[0] as string) || '';

    // Defaults asserted
    expect(url).toContain('status=ACTIVE');
    expect(url).toContain('sortDir=ASC');
    expect(url).toContain('perPage=50');

    // Search input cleared
    expect(screen.getByLabelText('Search locations')).toHaveValue('');
  });

  it('[AC-22] shows the number of currently applied filters, excluding search', async () => {
    const user = userEvent.setup();
    render(<LocationsPage />);

    // Initially 0
    expect(await screen.findByText('Filters (0)')).toBeInTheDocument();

    // Apply company only -> 1
    await user.type(screen.getByLabelText('Company'), 'comp-1');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Filters (1)')).toBeInTheDocument();

    // Add status -> 2
    await user.selectOptions(screen.getByLabelText('Status'), 'Inactive');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Filters (2)')).toBeInTheDocument();

    // Type a search — not counted
    await user.type(screen.getByLabelText('Search locations'), 'syd');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Filters (2)')).toBeInTheDocument();

    // Reset -> 0
    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
    expect(await screen.findByText('Filters (0)')).toBeInTheDocument();
  });
});
