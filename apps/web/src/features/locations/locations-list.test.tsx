import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { LocationsList } from './locations-list';

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
  buildQuery: (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const serialized = query.toString();
    return serialized ? `?${serialized}` : '';
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const locationResult = {
  data: [
    {
      id: 'location-1',
      name: 'Bayview Family Clinic',
      country: 'Canada',
      status: 'ACTIVE',
      companyId: 'company-1',
      company: { id: 'company-1', name: 'Acme Health' },
    },
  ],
  total: 1,
  page: 1,
  perPage: 50,
};

const companyResult = {
  data: [{ id: 'company-1', name: 'Acme Health' }],
  total: 1,
  page: 1,
  perPage: 100,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(apiFetch).mockImplementation((path) =>
    Promise.resolve((path.startsWith('/companies') ? companyResult : locationResult) as never),
  );
});

it('[AC-7] requests the default Active page of 50 A–Z locations with Name, Company, and Status', async () => {
  render(<LocationsList />);

  await screen.findByRole('link', { name: 'Bayview Family Clinic' });
  const initialRequest = jest.mocked(apiFetch).mock.calls[0][0];
  const query = new URLSearchParams(initialRequest.slice(initialRequest.indexOf('?') + 1));

  expect(initialRequest).toContain('/locations?');
  expect(query.get('status')).toBe('ACTIVE');
  expect(query.get('page')).toBe('1');
  expect(query.get('perPage')).toBe('50');
  expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Bayview Family Clinic Acme Health Active/ })).toBeInTheDocument();
});

it('[AC-8] sends a mixed-case partial location-name search to the list endpoint', async () => {
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Bayview Family Clinic' });

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search locations' }), {
    target: { value: 'bAy' },
  });

  await waitFor(() => {
    expect(jest.mocked(apiFetch).mock.calls.some(([path]) => path.includes('search=bAy'))).toBe(true);
  });
});

it('[AC-9] applies status, stored country, and Company filters together', async () => {
  const user = userEvent.setup();
  render(<LocationsList />);
  await screen.findByRole('link', { name: 'Bayview Family Clinic' });

  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'INACTIVE');
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter by country' }), {
    target: { value: 'Canada' },
  });
  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by company' }), 'company-1');

  await waitFor(() => {
    const filteredRequest = jest.mocked(apiFetch).mock.calls.find(([path]) => {
      return path.includes('status=INACTIVE') && path.includes('country=Canada') && path.includes('companyId=company-1');
    });
    expect(filteredRequest).toBeDefined();
  });
});
