import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LocationCompanyOption,
  LocationForm,
  LocationRecord,
  locationToForm,
} from './location-form';

const activeCompany: LocationCompanyOption = {
  id: 'company-active',
  name: 'Northside Health Group',
  isActive: true,
};

const inactiveCompany: LocationCompanyOption = {
  id: 'company-inactive',
  name: 'Cedar Health Group',
  isActive: false,
};

it('[AC-1] requires a name, limits its length, validates optional phone, and supports an optional Company', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <LocationForm
      mode="create"
      companies={[activeCompany]}
      onSubmit={onSubmit}
      onCancel={jest.fn()}
    />,
  );

  const name = screen.getByLabelText(/Location name/);
  expect(name).toBeRequired();
  expect(name).toHaveAttribute('maxLength', '100');
  expect(screen.getByLabelText(/Phone number/)).not.toBeRequired();
  expect(screen.getByRole('combobox', { name: /Company/ })).toHaveValue('');

  await user.type(name, 'North Clinic');
  await user.type(screen.getByLabelText(/Phone number/), 'invalid phone');
  await user.click(screen.getByRole('button', { name: 'Save Location' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid phone number.');
  expect(onSubmit).not.toHaveBeenCalled();

  await user.clear(screen.getByLabelText(/Phone number/));
  await user.type(screen.getByLabelText(/Phone number/), '+1 555 0100');
  await user.selectOptions(screen.getByRole('combobox', { name: /Company/ }), activeCompany.id);
  await user.click(screen.getByRole('button', { name: 'Save Location' }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'North Clinic',
    phone: '+1 555 0100',
    country: null,
    stateProvince: null,
    city: null,
    companyId: activeCompany.id,
  });
});

it('[AC-5] prepopulates saved values and retains, changes, or clears the Company association', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  const savedLocation: LocationRecord = {
    id: 'location-123',
    name: 'Northside Clinic',
    phone: '+1 555 0100',
    country: 'United States',
    stateProvince: 'Oregon',
    city: 'Portland',
    companyId: inactiveCompany.id,
    company: inactiveCompany,
  };
  render(
    <LocationForm
      mode="edit"
      locationId={savedLocation.id}
      initialValues={locationToForm(savedLocation)}
      currentCompany={savedLocation.company}
      companies={[activeCompany]}
      onSubmit={onSubmit}
      onCancel={jest.fn()}
    />,
  );

  expect(screen.getByLabelText(/Location name/)).toHaveValue('Northside Clinic');
  expect(screen.getByLabelText(/Phone number/)).toHaveValue('+1 555 0100');
  expect(screen.getByLabelText('City (optional)')).toHaveValue('Portland');
  expect(screen.getByLabelText('State / Province (optional)')).toHaveValue('Oregon');
  expect(screen.getByLabelText('Country (optional)')).toHaveValue('United States');
  const company = screen.getByRole('combobox', { name: /Company/ });
  expect(company).toHaveValue(inactiveCompany.id);
  expect(screen.getByRole('option', { name: /Cedar Health Group.*inactive/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Northside Health Group' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Clear selected Company' }));
  expect(company).toHaveValue('');
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Northside Clinic',
    phone: '+1 555 0100',
    country: 'United States',
    stateProvince: 'Oregon',
    city: 'Portland',
    companyId: null,
  });
});
