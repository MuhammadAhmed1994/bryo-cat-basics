import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { CompanySingleSelect } from './company-single-select';

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = jest.mocked(apiFetch);

function company(id: string, name: string, isActive: boolean): Company {
  const blankAddress = {
    line1: null,
    line2: null,
    country: null,
    state: null,
    city: null,
    postalCode: null,
  };
  return {
    id,
    name,
    phone: '',
    email: null,
    website: null,
    billingAddress: blankAddress,
    shippingSameAsBilling: true,
    shippingAddress: blankAddress,
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
  };
}

function page(data: Company[], total: number, current: number): Paginated<Company> {
  return { data, total, page: current, perPage: 1 };
}

it('[AC-12] offers only active Companies across pages and permits at most one, nullable selection', async () => {
  const activeFirst = company('active-1', 'Active Company One', true);
  const inactive = company('inactive', 'Inactive Company', false);
  const activeSecond = company('active-2', 'Active Company Two', true);
  mockedApiFetch
    .mockResolvedValueOnce(page([activeFirst, inactive], 2, 1))
    .mockResolvedValueOnce(page([activeSecond], 2, 2));
  const onChange = jest.fn();
  const user = userEvent.setup();

  render(<CompanySingleSelect value={null} onChange={onChange} />);

  const select = screen.getByRole('combobox', { name: 'Company (optional)' });
  expect(select).toBeDisabled();
  await waitFor(() => expect(select).toBeEnabled());
  expect(screen.getByRole('option', { name: 'Active Company One' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Active Company Two' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: inactive.name })).not.toBeInTheDocument();
  expect(select).not.toHaveAttribute('multiple');
  expect(mockedApiFetch).toHaveBeenNthCalledWith(
    1,
    '/companies?status=ACTIVE&page=1&perPage=100',
  );
  expect(mockedApiFetch).toHaveBeenNthCalledWith(
    2,
    '/companies?status=ACTIVE&page=2&perPage=100',
  );

  await user.selectOptions(select, 'active-1');
  expect(onChange).toHaveBeenLastCalledWith('active-1');
  await user.selectOptions(select, '');
  expect(onChange).toHaveBeenLastCalledWith(null);
});
