import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { LocationList } from './location-list';
import { LocationListRow } from './location-table';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  apiFetch: jest.fn(),
}));

const firstLocation: LocationListRow = {
  id: 'loc-1',
  name: 'North Clinic',
  company: 'Acme Group',
  companyId: 'company-1',
  status: 'ACTIVE',
  country: 'Canada',
};

function page(data: LocationListRow[]) {
  return { data, total: data.length, page: 1, perPage: 50 };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(apiFetch).mockResolvedValue(page([firstLocation]));
});

it('[AC-6] requests the default active A–Z page of 50 and displays Location, Company, and status columns', async () => {
  render(<LocationList />);

  expect(await screen.findByRole('link', { name: 'North Clinic' })).toHaveAttribute('href', '/locations/loc-1/edit');
  expect(screen.getByRole('columnheader', { name: /Location name/ })).toHaveAttribute('aria-sort', 'ascending');
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByTitle('Acme Group')).toBeInTheDocument();
  expect(screen.getByRole('row', { name: /North Clinic Acme Group Active Active Edit/ })).toBeInTheDocument();
  expect(apiFetch).toHaveBeenCalledWith('/locations?status=ACTIVE&page=1&perPage=50');
});

it('[AC-7] trims and searches partial names without case sensitivity and displays the no-match message', async () => {
  const user = userEvent.setup();
  jest.mocked(apiFetch)
    .mockResolvedValueOnce(page([firstLocation]))
    .mockResolvedValueOnce(page([firstLocation]))
    .mockResolvedValueOnce(page([]));
  render(<LocationList />);
  await screen.findByRole('link', { name: 'North Clinic' });

  const search = screen.getByRole('searchbox', { name: 'Search locations' });
  await user.type(search, '  cLiNiC  ');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  expect(await screen.findByRole('link', { name: 'North Clinic' })).toBeInTheDocument();
  await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/locations?search=cLiNiC&status=ACTIVE&page=1&perPage=50'));

  await user.clear(search);
  await user.type(search, 'nothing');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  expect(await screen.findByText('No locations found.')).toBeInTheDocument();
  expect(apiFetch).toHaveBeenLastCalledWith('/locations?search=nothing&status=ACTIVE&page=1&perPage=50');
});

it('[AC-8] applies status, country, and Company filters with a count and Reset restores defaults', async () => {
  const user = userEvent.setup();
  render(<LocationList />);
  await screen.findByRole('link', { name: 'North Clinic' });

  await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE');
  fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Canada' } });
  await user.selectOptions(screen.getByLabelText('Company'), 'company-1');

  expect(screen.getByLabelText('3 applied filters')).toBeInTheDocument();
  await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/locations?status=INACTIVE&country=Canada&companyId=company-1&page=1&perPage=50'));

  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByLabelText('Status')).toHaveValue('ACTIVE');
  expect(screen.getByLabelText('Country')).toHaveValue('');
  expect(screen.getByLabelText('Company')).toHaveValue('');
  expect(screen.getByLabelText('0 applied filters')).toBeInTheDocument();
  await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/locations?status=ACTIVE&page=1&perPage=50'));
});
