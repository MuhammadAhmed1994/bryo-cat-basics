import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { apiFetch } from '@/lib/api';
import { LocationsList } from './locations-list';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const location = {
  id: 'location-1',
  name: 'Northside Clinic',
  country: 'Canada',
  status: 'ACTIVE' as const,
  company: { id: 'company-1', name: 'Acme Health' },
};

function page<T>(data: T[], total = data.length, perPage = 50) {
  return { data, total, page: 1, perPage };
}

function setupApi() {
  mockedApiFetch.mockImplementation((path) => {
    if (path.startsWith('/companies')) {
      return Promise.resolve(page([{ id: 'company-1', name: 'Acme Health' }])) as never;
    }
    return Promise.resolve(page([location], 1)) as never;
  });
}

describe('Locations list', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    setupApi();
  });

  it('[AC-7] opens with active locations sorted by name and requests 50 per page', async () => {
    render(<LocationsList />);

    expect(await screen.findByRole('link', { name: 'Northside Clinic' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name Sorted ascending/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Active/ })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/locations?status=ACTIVE&page=1&perPage=50');
    });
  });

  it('[AC-8] submits partial-name searches without restricting letter case', async () => {
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Northside Clinic' });

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search locations' }), {
      target: { value: 'nOrTh' },
    });
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/locations?search=nOrTh&status=ACTIVE&page=1&perPage=50');
    });
  });

  it('[AC-9] combines status, stored-country, and Company filters in the list request', async () => {
    render(<LocationsList />);
    await screen.findByRole('link', { name: 'Northside Clinic' });

    await waitFor(() => expect(screen.getByRole('option', { name: 'Acme Health' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by status' }), {
      target: { value: 'INACTIVE' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter by country' }), {
      target: { value: 'Canada' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by company' }), {
      target: { value: 'company-1' },
    });

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/locations?status=INACTIVE&country=Canada&companyId=company-1&page=1&perPage=50',
      );
    });
  });
});
