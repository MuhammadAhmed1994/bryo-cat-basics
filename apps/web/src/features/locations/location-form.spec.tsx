import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm, LocationFormValues } from './location-form';

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(() => new Promise(() => {})),
}));

function renderForm() {
  const onSubmit = jest.fn<(values: LocationFormValues) => void>();
  const onCancel = jest.fn();
  render(<LocationForm onSubmit={onSubmit} onCancel={onCancel} />);
  return { onSubmit, onCancel };
}

it('[AC-1] accepts required name and optional company, contact, phone, and address fields', async () => {
  const user = userEvent.setup();
  const { onSubmit } = renderForm();

  const name = screen.getByRole('textbox', { name: /Location name/ });
  expect(name).toBeRequired();
  expect(name).toHaveAttribute('maxLength', '100');
  for (const label of [
    'Company (optional)',
    'Location phone',
    'Contact Person',
    'Contact Person phone',
    'Address line 1',
    'Address line 2',
    'Country',
    'State/Province',
    'City',
    'Postal code',
  ]) {
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  }

  await user.type(name, 'Northfield Distribution');
  await user.click(screen.getByRole('button', { name: 'Create Location' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Northfield Distribution',
    companyId: null,
  }));
});

it('[AC-4] enables dependent typed geography fields in order and clears child values on parent change', async () => {
  const user = userEvent.setup();
  const { onSubmit } = renderForm();
  const country = screen.getByLabelText('Country');
  const state = screen.getByLabelText('State/Province');
  const city = screen.getByLabelText('City');

  expect(state).toBeDisabled();
  expect(city).toBeDisabled();

  fireEvent.change(country, { target: { value: 'United States' } });
  expect(state).toBeEnabled();
  expect(city).toBeDisabled();
  fireEvent.change(state, { target: { value: 'California' } });
  expect(city).toBeEnabled();
  fireEvent.change(city, { target: { value: 'Oakland' } });
  await user.type(screen.getByLabelText(/Location name/), 'West Coast Office');
  await user.click(screen.getByRole('button', { name: 'Create Location' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    country: 'United States',
    stateProvince: 'California',
    city: 'Oakland',
  }));

  fireEvent.change(country, { target: { value: 'Canada' } });
  expect(state).toHaveValue('');
  expect(city).toHaveValue('');
  fireEvent.change(state, { target: { value: 'Ontario' } });
  fireEvent.change(city, { target: { value: 'Toronto' } });
  fireEvent.change(state, { target: { value: 'Quebec' } });
  expect(city).toHaveValue('');
});
