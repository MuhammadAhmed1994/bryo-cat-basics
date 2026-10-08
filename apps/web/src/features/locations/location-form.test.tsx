import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Company } from '@/lib/types';
import { LocationForm, type LocationFormValues } from './location-form';

function makeCompany(id: string, name: string, isActive: boolean): Company {
  return {
    id,
    name,
    phone: '+61400000000',
    email: null,
    website: null,
    billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    shippingSameAsBilling: true,
    shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
  };
}

function mountForm(props: {
  initialValues?: Partial<LocationFormValues>;
  companies?: Company[];
} = {}) {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  render(<LocationForm onSubmit={onSubmit} onCancel={onCancel} {...props} />);
  return { onSubmit, onCancel };
}

it('[AC-1] requires a non-empty name and rejects names longer than 100 characters', async () => {
  const user = userEvent.setup();
  const { onSubmit } = mountForm();

  await user.click(screen.getByRole('button', { name: 'Save Location' }));
  expect(screen.getByText('Location name is required.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();

  const overlongName = 'L'.repeat(101);
  await user.clear(screen.getByLabelText(/Location name/));
  await user.type(screen.getByLabelText(/Location name/), overlongName);
  await user.click(screen.getByRole('button', { name: 'Save Location' }));

  expect(screen.getByText('Location name must be 100 characters or fewer.')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('[AC-5] offers active Companies only in the optional Company selector', () => {
  mountForm({
    companies: [
      makeCompany('active-company', 'Active Company', true),
      makeCompany('inactive-company', 'Inactive Company', false),
    ],
  });

  const selector = screen.getByLabelText('Company');
  expect(screen.getByRole('option', { name: 'Active Company' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
  expect(selector).toHaveValue('');
});

it('[AC-7] disables dependent selectors until parents are set and clears descendants on changes', async () => {
  const user = userEvent.setup();
  mountForm();

  const country = screen.getByLabelText(/^Country/);
  expect(screen.getByLabelText(/^State\/Province/)).toBeDisabled();
  expect(screen.getByLabelText(/^City/)).toBeDisabled();

  await user.type(country, 'Canada');
  expect(screen.getByLabelText(/^State\/Province/)).toBeEnabled();
  await user.type(screen.getByLabelText(/^State\/Province/), 'Ontario');
  expect(screen.getByLabelText(/^City/)).toBeEnabled();
  await user.type(screen.getByLabelText(/^City/), 'Toronto');

  await user.clear(screen.getByLabelText(/^State\/Province/));
  await user.type(screen.getByLabelText(/^State\/Province/), 'Quebec');
  expect(screen.getByLabelText(/^City/)).toHaveValue('');
  await user.type(screen.getByLabelText(/^City/), 'Montreal');

  await user.clear(screen.getByLabelText(/^Country/));
  await user.type(screen.getByLabelText(/^Country/), 'United States');
  expect(screen.getByLabelText(/^State\/Province/)).toHaveValue('');
  expect(screen.getByLabelText(/^State\/Province/)).toBeEnabled();
  expect(screen.getByLabelText(/^City/)).toHaveValue('');
  expect(screen.getByLabelText(/^City/)).toBeDisabled();
});

it('[AC-11] preserves the saved hierarchy on edit and clears dependent values after parent changes', async () => {
  const user = userEvent.setup();
  mountForm({
    initialValues: {
      name: 'Saved Location',
      country: 'Canada',
      stateProvince: 'Ontario',
      city: 'Toronto',
    },
  });

  expect(screen.getByLabelText(/^Country/)).toHaveValue('Canada');
  expect(screen.getByLabelText(/^State\/Province/)).toHaveValue('Ontario');
  expect(screen.getByLabelText(/^City/)).toHaveValue('Toronto');
  expect(screen.getByLabelText(/^State\/Province/)).toBeEnabled();
  expect(screen.getByLabelText(/^City/)).toBeEnabled();

  await user.clear(screen.getByLabelText(/^Country/));
  await user.type(screen.getByLabelText(/^Country/), 'United States');
  expect(screen.getByLabelText(/^State\/Province/)).toHaveValue('');
  expect(screen.getByLabelText(/^City/)).toHaveValue('');
  expect(screen.getByLabelText(/^State\/Province/)).toBeEnabled();
  expect(screen.getByLabelText(/^City/)).toBeDisabled();

  await user.type(screen.getByLabelText(/^State\/Province/), 'California');
  await user.type(screen.getByLabelText(/^City/), 'Oakland');
  await user.clear(screen.getByLabelText(/^State\/Province/));
  await user.type(screen.getByLabelText(/^State\/Province/), 'Nevada');
  expect(screen.getByLabelText(/^City/)).toHaveValue('');
});
