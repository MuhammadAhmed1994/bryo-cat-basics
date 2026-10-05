import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm, EMPTY_LOCATION_FORM } from '../location-form';
import { CompanySelect } from '../company-select';

// Mock API for CompanySelect fetching
jest.mock('@/lib/api', () => {
  const active = (id: string, name: string) => ({
    id,
    name,
    phone: '+6100000000',
    email: null,
    website: null,
    billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    shippingSameAsBilling: true,
    shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: 'u1',
    updatedById: 'u1',
  });
  const inactive = (id: string, name: string) => ({
    ...active(id, name),
    isActive: false,
  });

  const data = [active('c1', 'Acme'), inactive('c2', 'Old Co'), active('c3', 'Beta')];
  const page = { data, total: data.length, page: 1, perPage: 50 };

  return {
    ApiError: class ApiError extends Error {
      status: number;
      constructor(status: number, message: string) {
        super(message);
        this.status = status;
      }
    },
    apiFetch: jest.fn(async (path: string) => {
      if (path.startsWith('/companies')) return page;
      return {} as any;
    }),
  };
});

describe('[AC-7]', () => {
  it('[AC-7] State disabled until Country and City disabled until State; changing Country clears both', async () => {
    const user = userEvent.setup();
    render(React.createElement(LocationForm, { initialValues: EMPTY_LOCATION_FORM }));

    const state = screen.getByLabelText('State/Province') as HTMLInputElement;
    const city = screen.getByLabelText('City') as HTMLInputElement;
    const country = screen.getByLabelText('Country') as HTMLInputElement;

    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.type(country, 'Australia');
    expect(screen.getByLabelText('State/Province')).toBeEnabled();
    expect(screen.getByLabelText('City')).toBeDisabled();

    await user.type(state, 'New South Wales');
    expect(screen.getByLabelText('City')).toBeEnabled();

    // Changing country clears both state and city selections
    await user.clear(country);
    await user.type(country, 'Canada');
    expect((screen.getByLabelText('State/Province') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('');
  });
});

describe('[AC-8]', () => {
  it('[AC-8] Company select lists only active companies and supports None', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(React.createElement(CompanySelect, { value: null, onChange }));

    // Options are populated from the mocked API: only active companies should appear.
    const select = await screen.findByLabelText('Company');
    const options = within(select).getAllByRole('option') as HTMLOptionElement[];
    const labels = options.map((o) => o.textContent);

    // Includes the clearing option and the two active companies
    expect(labels).toEqual(expect.arrayContaining(['None', 'Acme', 'Beta']));
    // Excludes the inactive company from the list
    expect(labels).not.toEqual(expect.arrayContaining(['Old Co (inactive)']));

    // Choosing None clears to null
    await user.selectOptions(select, ['']);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('[AC-10]', () => {
  it('[AC-10] Edit form pre-populates Company and country/state/city chain', () => {
    render(
      React.createElement(LocationForm, {
        initialValues: {
          name: 'Sydney Office',
          companyId: 'c2',
          geo: { country: 'Australia', stateProvince: 'New South Wales', city: 'Sydney' },
        },
        // The stored company became inactive; include it as a one-off option.
        initialCompanyOption: { id: 'c2', name: 'Old Co', isActive: false },
        submitLabel: 'Save Changes',
      }),
    );

    // Company shown as (inactive) and pre-selected
    const company = screen.getByLabelText('Company') as HTMLSelectElement;
    expect(company.value).toBe('c2');
    const selected = company.selectedOptions[0];
    expect(selected.textContent).toBe('Old Co (inactive)');

    // Full geo chain is pre-selected
    expect((screen.getByLabelText('Country') as HTMLInputElement).value).toBe('Australia');
    expect((screen.getByLabelText('State/Province') as HTMLInputElement).value).toBe(
      'New South Wales',
    );
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('Sydney');
  });
});
