import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm, toLocationPayload } from './location-form';

jest.mock('./company-single-select', () => ({
  CompanySingleSelect: () => null,
}));

describe('LocationForm', () => {
  it('[AC-1] accepts required name, optional details, and an optional single Company', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LocationForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    const name = screen.getByRole('textbox', { name: /Location name/ });
    expect(name).toBeRequired();
    expect(name).toHaveAttribute('maxLength', '100');
    expect(screen.getByLabelText('Location phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact person')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact person phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Address line 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Address line 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Postal code')).toBeInTheDocument();

    await user.type(name, 'Northfield Distribution');
    await user.type(screen.getByLabelText('Location phone'), '+1 415 555 0132');
    await user.type(screen.getByLabelText('Contact person'), 'Jordan Lee');
    await user.type(screen.getByLabelText('Contact person phone'), '+1 415 555 0144');
    await user.type(screen.getByLabelText('Address line 1'), '12 Market St');
    await user.click(screen.getByRole('button', { name: 'Create Location' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(toLocationPayload(onSubmit.mock.calls[0][0])).toMatchObject({
      name: 'Northfield Distribution',
      companyId: null,
      phone: '+1 415 555 0132',
      contactPerson: 'Jordan Lee',
      addressLine1: '12 Market St',
    });
  });

  it('[AC-4] stores typed geography and enables and clears dependent values', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LocationForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    const country = screen.getByRole('combobox', { name: 'Country' });
    const state = screen.getByRole('combobox', { name: 'State/Province' });
    const city = screen.getByRole('combobox', { name: 'City' });
    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.type(country, 'United States');
    expect(country).toHaveValue('United States');
    expect(state).toBeEnabled();
    await user.type(state, 'California');
    expect(city).toBeEnabled();
    await user.type(city, 'Oakland');
    expect(city).toHaveValue('Oakland');

    await user.clear(country);
    await user.type(country, 'Canada');
    expect(country).toHaveValue('Canada');
    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();

    await user.type(state, 'Ontario');
    await user.type(city, 'Toronto');
    await user.clear(state);
    await user.type(state, 'Quebec');
    expect(state).toHaveValue('Quebec');
    expect(city).toHaveValue('');
    expect(city).toBeEnabled();

    await user.type(screen.getByRole('textbox', { name: /Location name/ }), 'Test Location');
    await user.click(screen.getByRole('button', { name: 'Create Location' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      country: 'Canada',
      stateProvince: 'Quebec',
      city: '',
    }));
  });
});
