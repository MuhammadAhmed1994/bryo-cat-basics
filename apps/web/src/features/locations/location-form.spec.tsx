import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import { LocationForm } from './location-form';

jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

beforeEach(() => {
  jest.mocked(apiFetch).mockResolvedValue({ data: [], total: 0, page: 1, perPage: 25 });
});

describe('LocationForm', () => {
  it('[AC-1] accepts required name and optional company, contact, phone, and address details', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LocationForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    const name = screen.getByRole('textbox', { name: 'Location name *' });
    expect(name).toHaveAttribute('maxLength', '100');
    expect(name).toBeRequired();
    await user.type(name, 'Northfield Distribution');
    await user.type(screen.getByLabelText('Location phone'), '+1 415 555 0132');
    await user.type(screen.getByLabelText('Contact person'), 'Jordan Lee');
    await user.type(screen.getByLabelText('Contact person phone'), '+1 415 555 0144');
    await user.type(screen.getByLabelText('Address line 1'), '12 Market St');
    await user.type(screen.getByLabelText('Address line 2'), 'Suite 2');
    await user.type(screen.getByLabelText('Postal code'), '94612');
    await user.click(screen.getByRole('button', { name: 'Create Location' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Northfield Distribution',
      companyId: null,
      phone: '+1 415 555 0132',
      contactPerson: 'Jordan Lee',
      contactPersonPhone: '+1 415 555 0144',
      addressLine1: '12 Market St',
      addressLine2: 'Suite 2',
      postalCode: '94612',
    }));
    expect(screen.getByLabelText('Company (optional)')).toBeInTheDocument();
  });

  it('[AC-4] persists typed geography values, enables dependents in order, and clears them when a parent changes', async () => {
    const user = userEvent.setup();
    render(<LocationForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    const country = screen.getByLabelText('Country');
    const state = screen.getByLabelText('State/Province');
    const city = screen.getByLabelText('City');
    expect(state).toBeDisabled();
    expect(city).toBeDisabled();
    expect(country).toHaveAttribute('list', 'country-suggestions');

    await user.type(country, 'United States');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();
    await user.type(state, 'California');
    expect(city).toBeEnabled();
    await user.type(city, 'Oakland');
    expect(country).toHaveValue('United States');
    expect(state).toHaveValue('California');
    expect(city).toHaveValue('Oakland');

    await user.clear(country);
    await user.type(country, 'Canada');
    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();

    await user.type(state, 'Ontario');
    await user.type(city, 'Toronto');
    await user.clear(state);
    await user.type(state, 'Quebec');
    expect(city).toHaveValue('');
    expect(city).toBeEnabled();
  });
});
