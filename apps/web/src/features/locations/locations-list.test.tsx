import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { LocationsList } from './locations-list';

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

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const company = { id: 'company-1', name: 'Acme Health' };
const location = {
  id: 'location-1',
  name: 'Northside Clinic',
  country: 'Canada',
  status: 'ACTIVE' as const,
  companyId: company.id,
  company,
};

function paginated<T>(data: T[], total = data.length) {
  return { data, total, page: 1, perPage: 50 };
}

function setupApi() {
  mockedApiFetch.mockImplementation(async (path) => {
    if (path.startsWith('/companies')) return paginated([company]) as never;
    if (path.includes('status=INACTIVE')) {
      return paginated([{ ...location, status: 'INACTIVE' as const }]) as never;
    }
    return paginated([location]) as never;
  });
}

beforeEach(() => {
  mockedApiFetch.mockReset();
  setupApi();
});

afterEach(() => {
  jest.clearAllMocks();
});

it('[AC-7] initially requests 50 active locations and displays the sorted list columns', async () => {
  render(<LocationsList />);

  expect(await screen.findByRole('link', { name: 'Northside Clinic' })).toHaveAttribute(
    'href',
    '/locations/location-1/edit',
  );
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Northside Clinic Acme Health Active/ })).toBeInTheDocument();
  await waitFor(() => {
    expect(mockedApiFetch).toHaveBeenCalledWith('/locations?status=ACTIVE&page=1&perPage=50');
  });
});

it('[AC-8] submits a mixed-case partial name while preserving matching results', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);

  const search = screen.getByRole('searchbox', { name: 'Search locations' });
  await user.clear(search);
  await user.type(search, 'nOrTh');
  fireEvent.submit(search.closest('form')!);

  await waitFor(() => {
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/locations?search=nOrTh&status=ACTIVE&page=1&perPage=50',
    );
  });
  expect(await screen.findByRole('link', { name: 'Northside Clinic' })).toBeInTheDocument();
});

it('[AC-9] combines status, saved-country, and Company filters in the list request', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);

  await user.selectOptions(await screen.findByLabelText('Filter by status'), 'INACTIVE');
  fireEvent.change(screen.getByLabelText('Filter by country'), { target: { value: 'Canada' } });
  await user.selectOptions(screen.getByLabelText('Filter by company'), 'company-1');

  await waitFor(() => {
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/locations?status=INACTIVE&country=Canada&companyId=company-1&page=1&perPage=50',
    );
  });
  expect(
    await screen.findByRole('row', { name: /Northside Clinic Acme Health Inactive/ }),
  ).toBeInTheDocument();
});
