import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanySingleSelect } from './company-single-select';
import { apiFetch } from '@/lib/api';
import { Company, Paginated } from '@/lib/types';

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}));

function makeCompany(id: string, name: string, isActive: boolean): Company {
  return {
    id,
    name,
    phone: '+14155550100',
    email: null,
    website: null,
    billingAddress: {
      line1: null,
      line2: null,
      country: null,
      state: null,
      city: null,
      postalCode: null,
    },
    shippingSameAsBilling: true,
    shippingAddress: {
      line1: null,
      line2: null,
      country: null,
      state: null,
      city: null,
      postalCode: null,
    },
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
  };
}

describe('CompanySingleSelect', () => {
  it('[AC-12] offers active Companies only and permits at most one, including a cleared null value', async () => {
    const active = makeCompany('active-id', 'Active Company', true);
    const inactive = makeCompany('inactive-id', 'Inactive Company', false);
    jest.mocked(apiFetch).mockResolvedValue({
      data: [active, inactive],
      total: 2,
      page: 1,
      perPage: 25,
    } satisfies Paginated<Company>);
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<CompanySingleSelect value={null} onChange={onChange} />);

    const selector = screen.getByLabelText('Company (optional)');
    expect(selector).toBeDisabled();
    await waitFor(() => expect(selector).toBeEnabled());
    expect(screen.getByRole('option', { name: 'Active Company' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
    expect(selector).not.toHaveAttribute('multiple');
    expect(apiFetch).toHaveBeenCalledWith('/companies?status=ACTIVE');

    await user.selectOptions(selector, 'active-id');
    expect(onChange).toHaveBeenLastCalledWith('active-id');
    await user.selectOptions(selector, '');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
