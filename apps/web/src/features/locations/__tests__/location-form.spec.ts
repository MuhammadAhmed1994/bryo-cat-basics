import React from 'react';
// Mock the API module so tests can control responses per AC; keep other exports.
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeoCascadeField } from '../geo-cascade-field';
import { CompanySelect } from '../company-select';
import { LocationForm } from '../location-form';
import * as api from '@/lib/api';

describe('Locations — form behaviours', () => {
  it('[AC-7] enforces the geo cascade: State disabled until Country, City until State; changing Country clears children', async () => {
    const user = userEvent.setup();

    function Wrapper() {
      const [geo, setGeo] = React.useState({ country: '', stateProvince: '', city: '' });
      return React.createElement(GeoCascadeField, {
        value: geo,
        onChange: (next: any) => setGeo((g) => ({ ...g, ...next })),
      });
    }

    render(
      // wrap in a section to avoid "not wrapped in act" warnings on input changes
      React.createElement('section', null, React.createElement(Wrapper)),
    );

    const country = screen.getByLabelText('Country') as HTMLInputElement;
    const state = screen.getByLabelText('State/Province') as HTMLInputElement;
    const city = screen.getByLabelText('City') as HTMLInputElement;

    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.type(country, 'Australia');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();

    await user.type(state, 'New South Wales');
    expect(city).toBeEnabled();

    await user.type(city, 'Sydney');
    expect(city.value).toBe('Sydney');

    // Changing Country clears both State and City (AC-7)
    await user.clear(country);
    await user.type(country, 'New Zealand');

    expect(state.value).toBe('');
    expect(city.value).toBe('');
  });

  it('[AC-8] CompanySelect lists only active companies when searching', async () => {
    const user = userEvent.setup();

    const spy = api.apiFetch as jest.Mock;
    spy.mockResolvedValue({
      data: [
        { id: 'c1', name: 'Acme Cattle Co.', isActive: true },
        { id: 'c2', name: 'Old Holdings', isActive: false },
      ],
      total: 2,
      page: 1,
      perPage: 25,
    } as any);

    render(
      React.createElement('section', null,
        React.createElement(CompanySelect, { value: null, onChange: jest.fn() })
      ),
    );

    const input = screen.getByLabelText('Company');
    await user.click(input);
    await user.type(input, 'ac');

    // Only the active company appears in the list.
    expect(await screen.findByText('Acme Cattle Co.')).toBeInTheDocument();
    expect(screen.queryByText('Old Holdings')).not.toBeInTheDocument();

    // Also assert the request asked for ACTIVE companies (defensive check).
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(String(spy.mock.calls[0][0])).toContain('status=ACTIVE');
    });
  });

  it('[AC-10] Edit page pre-populates every stored value including Company and geo chain', async () => {
    render(
      React.createElement(LocationForm, {
        initialValues: {
          name: 'Sydney Office',
          companyId: 'c1',
          phone: '',
          contactName: '',
          contactPhone: '',
          addressLine1: '',
          addressLine2: '',
          postalCode: '2000',
          geo: { country: 'Australia', stateProvince: 'New South Wales', city: 'Sydney' },
        },
        initialCompany: { id: 'c1', name: 'Acme Cattle Co.', isActive: true },
        submitLabel: 'Save Changes',
        onSubmit: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    // Company field shows the associated Company name.
    const company = await screen.findByLabelText('Company');
    expect((company as HTMLInputElement).value).toContain('Acme Cattle Co.');

    // Geo chain is pre-filled.
    expect((await screen.findByLabelText('Country')) as HTMLInputElement).toHaveValue('Australia');
    expect(screen.getByLabelText('State/Province')).toHaveValue('New South Wales');
    expect(screen.getByLabelText('City')).toHaveValue('Sydney');
  });
});
