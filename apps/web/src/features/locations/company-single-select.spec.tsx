import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';
import { CompanySingleSelect } from './company-single-select';

jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: jest.fn(),
}));

function company(id: string, name: string, isActive: boolean): Company {
  const noAddress = {
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
    phone: '+14155550132',
    email: null,
    website: null,
    billingAddress: noAddress,
    shippingSameAsBilling: true,
    shippingAddress: noAddress,
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
  };
}

describe('CompanySingleSelect', () => {
  it('[AC-12] offers only active Companies and supports at most one or no selection', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const activeCompany = company('active-id', 'Active Company', true);
    const inactiveCompany = company('inactive-id', 'Inactive Company', false);
    jest.mocked(apiFetch).mockResolvedValue({
      data: [activeCompany, inactiveCompany],
      total: 2,
      page: 1,
      perPage: 100,
    } satisfies Paginated<Company> as never);

    render(<CompanySingleSelect value={null} onChange={onChange} />);

    const selector = await screen.findByRole('combobox', { name: /Company/ });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/companies?status=ACTIVE&perPage=100'));
    expect(screen.getByRole('option', { name: 'Active Company' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
    expect(selector).not.toHaveAttribute('multiple');

    await user.selectOptions(selector, 'active-id');
    expect(onChange).toHaveBeenLastCalledWith('active-id');

    await user.selectOptions(selector, '');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
