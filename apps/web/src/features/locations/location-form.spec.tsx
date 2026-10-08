import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm } from './location-form';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({ data: [], total: 0, page: 1, perPage: 100 }),
  }) as jest.Mock;
});

describe('LocationForm', () => {
  it('[AC-1] accepts the required name and optional Company, contact, phone, and address fields', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LocationForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    await screen.findByText('No active Companies available.');

    const name = screen.getByLabelText(/^Location name/);
    expect(name).toBeRequired();
    expect(name).toHaveAttribute('maxLength', '100');
    expect(screen.getByLabelText('Company (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Location phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Person')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Person phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Address line 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Address line 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Postal code')).toBeInTheDocument();

    await user.type(name, 'Northfield Distribution');
    await user.type(screen.getByLabelText('Location phone'), '+1 415 555 0132');
    await user.type(screen.getByLabelText('Contact Person'), 'Jordan Lee');
    await user.type(screen.getByLabelText('Address line 1'), '12 Market Street');
    await user.click(screen.getByRole('button', { name: 'Create Location' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Northfield Distribution',
      companyId: null,
      phone: '+1 415 555 0132',
      contactPerson: 'Jordan Lee',
      addressLine1: '12 Market Street',
    }));
  });

  it('[AC-4] retains typed geography values, enables dependent fields in order, and clears children when a parent changes', async () => {
    const user = userEvent.setup();
    render(<LocationForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    await screen.findByText('No active Companies available.');

    const country = screen.getByRole('combobox', { name: 'Country' });
    const state = screen.getByRole('combobox', { name: 'State/Province' });
    const city = screen.getByRole('combobox', { name: 'City' });
    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.type(country, 'United States');
    expect(state).toBeEnabled();
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
  });
});
