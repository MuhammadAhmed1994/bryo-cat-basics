import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationsPage from '@/app/(app)/locations/page';

// Mock API helper
jest.mock('@/lib/api', () => {
  return {
    apiFetch: jest.fn(),
    buildQuery: (params: Record<string, string | number | undefined>) => {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v));
      }
      const q = search.toString();
      return q ? `?${q}` : '';
    },
  };
});

// Mock useSearchParams to allow controlling query flags
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    useSearchParams: jest.fn(() => new URLSearchParams('')),
  };
});

const { apiFetch } = jest.requireMock('@/lib/api') as { apiFetch: jest.Mock };
const { useSearchParams } = jest.requireMock('next/navigation') as {
  useSearchParams: jest.Mock;
};

function mockCompanies() {
  apiFetch.mockImplementation((path: string) => {
    if (String(path).startsWith('/companies')) {
      return Promise.resolve({ data: [{ id: 'comp_1', name: 'Acme Cattle Co.' }] });
    }
    if (String(path).startsWith('/locations')) {
      return Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 });
    }
    return Promise.resolve({});
  });
}

describe('Locations List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default: no toast flag
    useSearchParams.mockReturnValue(new URLSearchParams(''));
  });

  it('[AC-6] shows success toast after create when redirected with added flag', async () => {
    apiFetch.mockResolvedValueOnce({ data: [], total: 0, page: 1, perPage: 50 });
    useSearchParams.mockReturnValue(new URLSearchParams('added=1'));

    render(<LocationsPage />);

    expect(await screen.findByText('Location added successfully')).toBeInTheDocument();
  });

  it('[AC-15] renders Name, Company (dash when none) and Status with dot + label', async () => {
    // First call is /locations
    apiFetch.mockImplementation((path: string) => {
      if (String(path).startsWith('/companies')) {
        return Promise.resolve({ data: [] });
      }
      if (String(path).startsWith('/locations')) {
        return Promise.resolve({
          data: [
            { id: 'loc_1', name: 'Sydney Office', companyId: 'comp_1', status: 'ACTIVE' },
            { id: 'loc_2', name: 'Empty Company', companyId: null, status: 'INACTIVE' },
          ],
          total: 2,
          page: 1,
          perPage: 50,
        });
      }
      return Promise.resolve({});
    });

    render(<LocationsPage />);

    // Wait for table rows
    expect(await screen.findByText('Sydney Office')).toBeInTheDocument();
    // Company dash when none
    expect(screen.getAllByText('-')[0]).toBeInTheDocument();
    // Status labels
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('[AC-18] shows empty state when no locations match', async () => {
    apiFetch.mockResolvedValueOnce({ data: [], total: 0, page: 1, perPage: 50 });
    render(<LocationsPage />);
    expect(await screen.findByText('No locations found.')).toBeInTheDocument();
  });

  it('[AC-20] offers Status (All/Inactive), Country and Company filters and Apply re-queries', async () => {
    mockCompanies();
    // initial locations load
    apiFetch.mockResolvedValueOnce({
      data: [
        { id: 'loc_1', name: 'Sydney Office', companyId: 'comp_1', status: 'ACTIVE' },
      ],
      total: 1,
      page: 1,
      perPage: 50,
    });

    const user = userEvent.setup();
    render(<LocationsPage />);

    // Wait for company options to load
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    const statusSelect = await screen.findByLabelText('Status');
    const countryInput = screen.getByLabelText('Country');
    const companySelect = screen.getByLabelText('Company');

    await user.selectOptions(statusSelect, 'INACTIVE');
    await user.clear(countryInput);
    await user.type(countryInput, 'CA');
    await user.selectOptions(companySelect, 'comp_1');

    // Click Apply
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // The API should be called again with the chosen filters in the query
    const lastCallArg = apiFetch.mock.calls[apiFetch.mock.calls.length - 1][0] as string;
    expect(lastCallArg).toContain('status=INACTIVE');
    expect(lastCallArg).toContain('country=CA');
    expect(lastCallArg).toContain('company=comp_1');
  });

  it('[AC-21] Reset Filters clears status/country/company and the search box, returning to defaults', async () => {
    mockCompanies();
    // initial load
    apiFetch.mockResolvedValueOnce({ data: [], total: 0, page: 1, perPage: 50 });

    const user = userEvent.setup();
    render(<LocationsPage />);

    // set search and filters
    const search = screen.getByLabelText('Search locations');
    await user.type(search, 'syd');
    const statusSelect = await screen.findByLabelText('Status');
    const countryInput = screen.getByLabelText('Country');
    const companySelect = screen.getByLabelText('Company');

    await user.selectOptions(statusSelect, 'ALL');
    await user.clear(countryInput);
    await user.type(countryInput, 'AU');
    await user.selectOptions(companySelect, 'comp_1');

    // Apply once to trigger a load with filters (not the subject of this AC)
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // Now Reset Filters
    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));

    // Search input cleared
    expect(screen.getByLabelText('Search locations')).toHaveValue('');

    // Last API call should include defaults: status ACTIVE, perPage 50, and no country/company
    const lastCallArg = apiFetch.mock.calls[apiFetch.mock.calls.length - 1][0] as string;
    expect(lastCallArg).toContain('status=ACTIVE');
    expect(lastCallArg).toContain('perPage=50');
    expect(lastCallArg).not.toContain('country=');
    expect(lastCallArg).not.toContain('company=');
  });

  it('[AC-22] shows applied-filter count chip next to Filters not counting search', async () => {
    mockCompanies();
    // initial load
    apiFetch.mockResolvedValueOnce({ data: [], total: 0, page: 1, perPage: 50 });

    const user = userEvent.setup();
    render(<LocationsPage />);

    // Initially 0 applied
    expect(await screen.findByText('Filters (0)')).toBeInTheDocument();

    // Select country + company (2 filters)
    const countryInput = screen.getByLabelText('Country');
    const companySelect = screen.getByLabelText('Company');
    await user.type(countryInput, 'US');
    await user.selectOptions(companySelect, 'comp_1');

    expect(screen.getByText('Filters (2)')).toBeInTheDocument();

    // Changing search should not change the count
    const search = screen.getByLabelText('Search locations');
    await user.type(search, 'syd');
    expect(screen.getByText('Filters (2)')).toBeInTheDocument();
  });
});
