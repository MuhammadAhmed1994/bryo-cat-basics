import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Company } from '@/lib/types';
import { CompanySelect } from '../company-select';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';
import { LocationDTO, LocationForm } from '../location-form';
import { apiFetch } from '@/lib/api';

// Mock next/navigation for pages that use the router
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
}));

// Mock API layer
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function renderNewForm() {
  render(
    <LocationForm submitLabel="Save Location" onSubmit={jest.fn()} onCancel={jest.fn()} />,
  );
}

describe('Location Add/Edit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[AC-7] disables children until a parent is chosen and clears on country change', async () => {
    const user = userEvent.setup();
    renderNewForm();

    const country = screen.getByLabelText('Country') as HTMLSelectElement;
    const state = screen.getByLabelText('State/Province') as HTMLSelectElement;
    const city = screen.getByLabelText('City') as HTMLSelectElement;

    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.selectOptions(country, 'Australia');
    expect(state).not.toBeDisabled();
    expect(city).toBeDisabled();

    await user.selectOptions(state, 'New South Wales');
    expect(city).not.toBeDisabled();

    // Changing the country clears State/Province and City (AC-7)
    await user.selectOptions(country, 'United States');
    expect(state.value).toBe('');
    expect(city.value).toBe('');
    expect(city).toBeDisabled();
  });

  it('[AC-8] CompanySelect lists only active companies', async () => {
    const user = userEvent.setup();

    // Return both active and inactive, but only active should be shown.
    const companies: Company[] = [
      // @ts-ignore — only fields used by the component are relevant here
      { id: 'a', name: 'Active A', isActive: true },
      // @ts-ignore
      { id: 'b', name: 'Inactive Co', isActive: false },
      // @ts-ignore
      { id: 'c', name: 'Active B', isActive: true },
    ];

    (mockApiFetch as jest.Mock).mockResolvedValue({ data: companies, total: 3, page: 1, perPage: 50 });

    render(<CompanySelect id="company" value={null} onChange={jest.fn()} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    // Wait for the options to load
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Active A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Active B' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inactive Co' })).not.toBeInTheDocument();
  });

  it('[AC-10] Edit page pre-populates all stored values including company and geo chain', async () => {
    const location: LocationDTO = {
      id: 'loc-1',
      name: 'Sydney Office',
      companyId: 'comp-1',
      phone: '+61 2 9000 0000',
      contactPersonName: 'Dana',
      contactPersonPhone: '+61 400 000 000',
      addressLine1: '42 Harbour Road',
      addressLine2: 'Level 3',
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Sydney',
      postalCode: '2000',
      status: 'ACTIVE',
    };

    // First call: location; second: company
    (mockApiFetch as jest.Mock)
      .mockResolvedValueOnce(location)
      // @ts-ignore — only the used fields are necessary here
      .mockResolvedValueOnce({ id: 'comp-1', name: 'Inactive Co', isActive: false } as Company);

    render(<EditLocationPage params={{ id: 'loc-1' }} />);

    // Wait for fields to be populated by checking prefilled country
    await waitFor(() => expect(screen.getByLabelText('Country')).toHaveValue('Australia'));

    // Company shown with its label (inactive included as one-off)
    const combo = screen.getByLabelText('Company') as HTMLInputElement;
    expect(combo.value).toMatch(/Inactive Co/);

    // Geo chain retains the stored values
    expect(screen.getByLabelText('Country')).toHaveValue('Australia');
    expect(screen.getByLabelText('State/Province')).toHaveValue('New South Wales');
    expect(screen.getByLabelText('City')).toHaveValue('Sydney');
  });
});
