import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { LocationsList } from './locations-list';

jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: jest.fn(),
  buildQuery: (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return query.toString() ? `?${query.toString()}` : '';
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const record = {
  id: 'loc-1',
  name: 'Northside Clinic',
  country: 'Canada',
  status: 'ACTIVE' as const,
  companyId: 'company-1',
  company: { id: 'company-1', name: 'Acme Health' },
};
const locationPage = { data: [record], total: 1, page: 1, perPage: 50 };
const companyPage = {
  data: [{ id: 'company-1', name: 'Acme Health' }],
  total: 1,
  page: 1,
  perPage: 100,
};

const mockedApiFetch = jest.mocked(apiFetch);

beforeEach(() => {
  mockedApiFetch.mockReset();
  mockedApiFetch.mockImplementation(async (path: string) =>
    (path.startsWith('/companies') ? companyPage : locationPage) as never,
  );
});

describe('Locations list acceptance', () => {
  it('[AC-7] opens with Active name-sorted locations and requests 50 records per page', async () => {
    render(<LocationsList />);

    expect(await screen.findByRole('link', { name: 'Northside Clinic' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name sorted ascending' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Active/ })).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/locations?status=ACTIVE&page=1&perPage=50',
      ),
    );
  });

  it('[AC-8] sends partial mixed-case name searches and renders the matching location', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);

    const search = screen.getByRole('searchbox', { name: 'Search locations' });
    await user.type(search, 'nOrTh');

    expect(await screen.findByRole('link', { name: 'Northside Clinic' })).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/locations?search=nOrTh&status=ACTIVE&page=1&perPage=50',
      ),
    );
  });

  it('[AC-9] combines status, stored country, and Company filters in the location request', async () => {
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Northside Clinic' });
    await screen.findByRole('option', { name: 'Acme Health' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by status' }), {
      target: { value: 'INACTIVE' },
    });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Country' }), {
      target: { value: 'Canada' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by company' }), {
      target: { value: 'company-1' },
    });

    await waitFor(() =>
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/locations?status=INACTIVE&country=Canada&companyId=company-1&page=1&perPage=50',
      ),
    );
  });
});
