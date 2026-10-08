import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm, LocationValues, toLocationPayload } from './location-form';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const savedValues: LocationValues = {
  name: 'Northside Clinic',
  phone: '+1 555 0100',
  country: 'United States',
  stateProvince: 'Oregon',
  city: 'Portland',
  companyId: 'company-inactive',
};

beforeEach(() => {
  Object.defineProperty(global, 'fetch', {
    configurable: true,
    value: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, page: 1, perPage: 100 }),
    }),
  });
});

afterEach(() => {
  delete (global as { fetch?: typeof fetch }).fetch;
});

it('[AC-1] requires a Location name and offers optional phone and Company fields', async () => {
  const user = userEvent.setup();
  render(<LocationForm mode="create" />);
  const name = screen.getByLabelText(/Location name/);
  const phone = screen.getByLabelText('Phone number');
  const company = screen.getByLabelText('Company (optional)');
  expect(name).toBeRequired();
  expect(name).toHaveAttribute('maxLength', '100');
  expect(phone).not.toBeRequired();
  expect(company).not.toBeRequired();

  await user.click(screen.getByRole('button', { name: 'Save Location' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a location name.');
  await user.type(name, 'Northside Clinic');
  await user.type(phone, 'invalid phone');
  await user.click(screen.getByRole('button', { name: 'Save Location' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid phone number.');
  expect(name).toHaveValue('Northside Clinic');
  expect(phone).toHaveValue('invalid phone');
  expect(toLocationPayload({ name: 'Northside Clinic', phone: '', country: '', stateProvince: '', city: '', companyId: '' })).toMatchObject({ phone: null, companyId: null });
});

it('[AC-5] prepopulates saved Location values and lets the user clear its current Company', async () => {
  const user = userEvent.setup();
  render(
    <LocationForm
      mode="edit"
      locationId="location-1"
      initialValues={savedValues}
      currentCompany={{ id: 'company-inactive', name: 'Cedar Health Group', isActive: false }}
    />,
  );

  expect(screen.getByLabelText(/Location name/)).toHaveValue('Northside Clinic');
  expect(screen.getByLabelText('Phone number')).toHaveValue('+1 555 0100');
  expect(screen.getByLabelText('Country')).toHaveValue('United States');
  expect(screen.getByLabelText('State / Province')).toHaveValue('Oregon');
  expect(screen.getByLabelText('City')).toHaveValue('Portland');
  const company = screen.getByLabelText('Company (optional)');
  await waitFor(() => expect(company).toHaveValue('company-inactive'));
  expect(screen.getByRole('option', { name: 'Cedar Health Group (Inactive — currently associated)' })).toBeInTheDocument();

  await user.selectOptions(company, '');
  expect(company).toHaveValue('');
  fireEvent.change(screen.getByLabelText(/Location name/), { target: { value: 'Northside Clinic Updated' } });
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith(
    expect.stringContaining('/locations/location-1'),
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Northside Clinic Updated',
        phone: '+1 555 0100',
        country: 'United States',
        stateProvince: 'Oregon',
        city: 'Portland',
        companyId: null,
      }),
    }),
  ));
});
