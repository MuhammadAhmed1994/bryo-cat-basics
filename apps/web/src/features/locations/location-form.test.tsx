import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Company } from '@/lib/types';
import { LocationForm, LocationFormValues } from './location-form';

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

function renderForm(props: Partial<React.ComponentProps<typeof LocationForm>> = {}) {
  const onSubmit = jest.fn<void, [LocationFormValues]>();
  const onCancel = jest.fn();
  render(<LocationForm onSubmit={onSubmit} onCancel={onCancel} {...props} />);
  return { onSubmit, onCancel };
}

it('[AC-1] requires a non-empty location name and rejects names over 100 characters', async () => {
  const user = userEvent.setup();
  const { onSubmit } = renderForm();
  const name = screen.getByLabelText(/^Location name/);

  await user.click(screen.getByRole('button', { name: 'Save Location' }));
  expect(screen.getByText('Enter a location name.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();

  await user.type(name, 'x'.repeat(101));
  await user.click(screen.getByRole('button', { name: 'Save Location' }));
  expect(screen.getByText('Location name must be 100 characters or fewer.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('[AC-5] lists active Companies and excludes inactive Companies', () => {
  renderForm({ companies: [company('active-id', 'Active Company', true), company('inactive-id', 'Inactive Company', false)] });
  const companySelect = screen.getByLabelText('Company');

  expect(companySelect).toHaveDisplayValue('No Company');
  expect(screen.getByRole('option', { name: 'Active Company' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
});

it('[AC-7] disables dependent selectors and clears descendants when a parent changes', async () => {
  const user = userEvent.setup();
  renderForm();
  const country = screen.getByLabelText('Country');
  const state = screen.getByLabelText('State/Province');
  const city = screen.getByLabelText('City');

  expect(state).toBeDisabled();
  expect(city).toBeDisabled();
  await user.type(country, 'Canada');
  expect(screen.getByLabelText('State/Province')).toBeEnabled();
  expect(screen.getByLabelText('City')).toBeDisabled();
  await user.type(state, 'Ontario');
  await user.type(city, 'Toronto');
  expect(city).toHaveValue('Toronto');

  await user.clear(country);
  await user.type(country, 'Australia');
  expect(screen.getByLabelText('State/Province')).toHaveValue('');
  expect(screen.getByLabelText('City')).toHaveValue('');
  expect(screen.getByLabelText('City')).toBeDisabled();

  await user.type(screen.getByLabelText('State/Province'), 'Victoria');
  await user.type(screen.getByLabelText('City'), 'Melbourne');
  await user.clear(screen.getByLabelText('State/Province'));
  await user.type(screen.getByLabelText('State/Province'), 'Queensland');
  expect(screen.getByLabelText('City')).toHaveValue('');
});

it('[AC-11] displays saved hierarchy values in edit mode and clears descendants identically', async () => {
  const user = userEvent.setup();
  renderForm({
    submitLabel: 'Save Changes',
    initialValues: {
      name: 'Distribution Centre',
      description: '',
      companyId: '',
      contactPersonName: '',
      contactPersonEmail: '',
      contactPersonPhone: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      country: 'United States',
      stateProvince: 'California',
      city: 'Oakland',
      postalCode: '',
    },
  });

  expect(screen.getByLabelText('Country')).toHaveValue('United States');
  expect(screen.getByLabelText('State/Province')).toHaveValue('California');
  expect(screen.getByLabelText('City')).toHaveValue('Oakland');
  expect(screen.getByLabelText('State/Province')).toBeEnabled();
  expect(screen.getByLabelText('City')).toBeEnabled();

  await user.clear(screen.getByLabelText('Country'));
  await user.type(screen.getByLabelText('Country'), 'Canada');
  expect(screen.getByLabelText('State/Province')).toHaveValue('');
  expect(screen.getByLabelText('City')).toHaveValue('');
  await user.type(screen.getByLabelText('State/Province'), 'Ontario');
  await user.type(screen.getByLabelText('City'), 'Toronto');
  await user.clear(screen.getByLabelText('State/Province'));
  await user.type(screen.getByLabelText('State/Province'), 'Quebec');
  expect(screen.getByLabelText('City')).toHaveValue('');
});
