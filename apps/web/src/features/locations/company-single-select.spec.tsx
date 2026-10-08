import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { Company, Paginated } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { CompanySingleSelect } from './company-single-select';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function company(id: string, name: string, isActive: boolean): Company {
  return {
    id,
    name,
    phone: '',
    email: null,
    website: null,
    billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    shippingSameAsBilling: true,
    shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    isActive,
    createdAt: '',
    updatedAt: '',
    createdById: null,
    updatedById: null,
  };
}

function SelectorHarness() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  return <CompanySingleSelect value={companyId} onChange={setCompanyId} />;
}

describe('CompanySingleSelect', () => {
  beforeEach(() => mockedApiFetch.mockReset());

  it('[AC-12] offers only active Companies across pages and maintains at most one selection', async () => {
    const activeOne = company('active-1', 'Active One', true);
    const inactive = company('inactive-1', 'Inactive Company', false);
    const activeTwo = company('active-2', 'Active Two', true);
    mockedApiFetch
      .mockResolvedValueOnce({ data: [activeOne, inactive], total: 3, page: 1, perPage: 100 } as Paginated<Company>)
      .mockResolvedValueOnce({ data: [activeTwo], total: 3, page: 2, perPage: 100 } as Paginated<Company>);

    render(<SelectorHarness />);

    const trigger = screen.getByRole('button', { name: 'Company (optional)' });
    expect(trigger).toBeDisabled();
    await waitFor(() => expect(trigger).toBeEnabled());

    expect(mockedApiFetch).toHaveBeenNthCalledWith(1, '/companies?status=ACTIVE&page=1&perPage=100');
    expect(mockedApiFetch).toHaveBeenNthCalledWith(2, '/companies?status=ACTIVE&page=2&perPage=100');
    fireEvent.click(trigger);
    const options = screen.getByRole('listbox', { name: 'Active Companies' });
    expect(within(options).getByRole('option', { name: 'Active One' })).toBeInTheDocument();
    expect(within(options).getByRole('option', { name: 'Active Two' })).toBeInTheDocument();
    expect(within(options).queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();

    fireEvent.click(within(options).getByRole('option', { name: 'Active One' }));
    expect(screen.getByText('Selected: Active One')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const firstOption = screen.getByRole('option', { name: 'Active One' });
    fireEvent.keyDown(firstOption, { key: 'ArrowDown' });
    const secondOption = screen.getByRole('option', { name: 'Active Two' });
    fireEvent.keyDown(secondOption, { key: 'Enter' });

    expect(screen.queryByText('Selected: Active One')).not.toBeInTheDocument();
    expect(screen.getByText('Selected: Active Two')).toBeInTheDocument();
  });
});
