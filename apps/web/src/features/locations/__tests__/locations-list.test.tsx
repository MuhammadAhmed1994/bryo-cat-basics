import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsList } from '@/app/(app)/locations/page';
import { LocationsTable } from '@/features/locations/locations-table';

// Mock api module but keep buildQuery real
const apiFetchMock = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  apiFetch: (...args: any[]) => (apiFetchMock as any)(...args),
}));

function makeLocation(id: string, overrides: Partial<{ name: string; companyName: string | null; status: 'ACTIVE' | 'INACTIVE' }> = {}) {
  return {
    id,
    name: overrides.name ?? `Loc ${id}`,
    companyName: overrides.companyName ?? 'Acme',
    status: overrides.status ?? 'ACTIVE',
  };
}

function paged(data: any[], total?: number) {
  return { data, total: total ?? data.length, page: 1, perPage: 50 };
}

beforeEach(() => {
  apiFetchMock.mockReset();
});

it('[AC-15] renders Name, Company (dash when none) and Status with dot + label', () => {
  render(
    <LocationsTable
      rows={[
        makeLocation('1', { name: 'Sydney Office', companyName: 'Acme Cattle Co.', status: 'ACTIVE' }),
        makeLocation('2', { name: 'Newcastle Yard', companyName: '', status: 'INACTIVE' }),
      ]}
    />,
  );

  expect(screen.getByText('Sydney Office')).toBeInTheDocument();
  // Company shows a dash when null
  const row = screen.getByText('Newcastle Yard').closest('tr')!;
  expect(within(row).getByText('-')).toBeInTheDocument();
  // Status shows dot + label (StatusDot uses aria-label Active/Inactive)
  expect(within(row).getByLabelText('Inactive')).toBeInTheDocument();
  expect(within(row).getByText('Inactive')).toBeInTheDocument();
});

it('[AC-18] shows "No locations found." when a search returns no rows', async () => {
  // First load returns one record; second call (with search) returns empty
  apiFetchMock.mockImplementation((path: string) => {
    if (path.startsWith('/locations')) {
      const url = new URL('http://x' + path);
      const search = url.searchParams.get('search') ?? '';
      if (search) return Promise.resolve(paged([]));
      return Promise.resolve(paged([makeLocation('1', { name: 'Sydney Office' })]));
    }
    return Promise.resolve(paged([]));
  });

  render(<LocationsList />);

  // Initial record present
  expect(await screen.findByText('Sydney Office')).toBeInTheDocument();

  // Apply a search that yields nothing
  const input = screen.getByLabelText('Search locations by name');
  await userEvent.clear(input);
  await userEvent.type(input, 'nope{enter}');

  await waitFor(() => expect(screen.getByText('No locations found.')).toBeInTheDocument());
});

it('[AC-20] Apply re-queries the list with Status, Country and Company filters', async () => {
  apiFetchMock.mockImplementation((path: string) => Promise.resolve(paged([])));

  render(<LocationsList />);

  const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
  const countryInput = screen.getByLabelText('Country') as HTMLInputElement;
  const companyInput = screen.getByLabelText('Company') as HTMLInputElement;

  // Options include All and Inactive
  expect(within(statusSelect).getByText('All')).toBeInTheDocument();
  expect(within(statusSelect).getByText('Inactive')).toBeInTheDocument();

  await userEvent.selectOptions(statusSelect, 'INACTIVE');
  await userEvent.type(countryInput, 'USA');
  await userEvent.type(companyInput, 'c1');

  await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

  // Inspect last call
  const lastPath = apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0] as string;
  const url = new URL('http://x' + lastPath);
  expect(url.pathname).toBe('/locations');
  expect(url.searchParams.get('status')).toBe('INACTIVE');
  expect(url.searchParams.get('country')).toBe('USA');
  expect(url.searchParams.get('company')).toBe('c1');
});

it('[AC-21] Reset Filters clears status, country, company and the search box and restores defaults', async () => {
  apiFetchMock.mockImplementation((path: string) => Promise.resolve(paged([])));

  render(<LocationsList />);

  const search = screen.getByLabelText('Search locations by name') as HTMLInputElement;
  const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
  const countryInput = screen.getByLabelText('Country') as HTMLInputElement;
  const companyInput = screen.getByLabelText('Company') as HTMLInputElement;

  await userEvent.type(search, ' syd ');
  await userEvent.selectOptions(statusSelect, 'ALL');
  await userEvent.type(countryInput, 'AU');
  await userEvent.type(companyInput, 'c2');

  await userEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));

  expect(search.value).toBe('');
  expect(statusSelect.value).toBe('ACTIVE');
  expect(countryInput.value).toBe('');
  expect(companyInput.value).toBe('');

  const lastPath = apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0] as string;
  const url = new URL('http://x' + lastPath);
  expect(url.searchParams.get('status')).toBe('ACTIVE');
  expect(url.searchParams.get('perPage')).toBe('50');
});

it('[AC-22] applied-filter count chip shows non-default filters only (not search)', async () => {
  apiFetchMock.mockImplementation((path: string) => Promise.resolve(paged([])));

  render(<LocationsList />);

  // Starts at 0
  const countChip = screen.getByText('0');
  expect(countChip).toBeInTheDocument();

  // Set country + company, apply -> count becomes 2
  const countryInput = screen.getByLabelText('Country') as HTMLInputElement;
  const companyInput = screen.getByLabelText('Company') as HTMLInputElement;
  await userEvent.type(countryInput, 'AU');
  await userEvent.type(companyInput, 'c7');
  await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(await screen.findByText('2')).toBeInTheDocument();

  // Search does not change the count
  const search = screen.getByLabelText('Search locations by name') as HTMLInputElement;
  await userEvent.type(search, 'syd{enter}');
  expect(screen.getByText('2')).toBeInTheDocument();

  // Reset -> back to 0
  await userEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));
  expect(await screen.findByText('0')).toBeInTheDocument();
});

it('[AC-6] shows a success toast when arriving after creating a Location', async () => {
  apiFetchMock.mockImplementation((path: string) => Promise.resolve(paged([])));

  render(<LocationsList showToastInitial />);

  expect(screen.getByText('Location added successfully')).toBeInTheDocument();
});
