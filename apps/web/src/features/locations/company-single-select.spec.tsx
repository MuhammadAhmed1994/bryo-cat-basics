import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Company } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { CompanySingleSelect } from './company-single-select';

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = jest.mocked(apiFetch);

function makeCompany(id: string, name: string, isActive: boolean): Company {
  const address = {
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
    billingAddress: address,
    shippingSameAsBilling: true,
    shippingAddress: address,
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
  };
}

describe('CompanySingleSelect', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('[AC-12] offers only active Companies and permits at most one selection', async () => {
    mockedApiFetch.mockResolvedValue({
      data: [
        makeCompany('active-1', 'Active Company', true),
        makeCompany('inactive-1', 'Inactive Company', false),
        makeCompany('active-2', 'Second Active Company', true),
      ],
      total: 3,
      page: 1,
      perPage: 50,
    } as never);
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<CompanySingleSelect value="active-1" onChange={onChange} />);
    const selector = screen.getByLabelText('Company (optional)');

    expect(selector).toBeDisabled();
    await waitFor(() => expect(selector).toBeEnabled());
    expect(mockedApiFetch).toHaveBeenCalledWith('/companies?status=ACTIVE');
    expect(screen.getByRole('option', { name: 'Active Company' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Second Active Company' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
    expect(selector).toHaveProperty('multiple', false);
    expect(selector).toHaveValue('active-1');

    await user.tab();
    expect(selector).toHaveFocus();
    await user.selectOptions(selector, 'active-2');
    expect(onChange).toHaveBeenLastCalledWith('active-2');
    await user.selectOptions(selector, '');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
