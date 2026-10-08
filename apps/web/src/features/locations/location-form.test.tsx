import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LocationForm,
  LocationFormValues,
  SavedLocation,
  locationToForm,
} from './location-form';

const companies = [
  { id: 'company-active', name: 'Active Health', isActive: true },
  { id: 'company-inactive', name: 'Former Health', isActive: false },
];

function makeLocation(overrides: Partial<SavedLocation> = {}): SavedLocation {
  return {
    id: 'location-1',
    name: 'Northside Clinic',
    phone: '+1 555 0100',
    country: 'United States',
    stateProvince: 'Oregon',
    city: 'Portland',
    companyId: 'company-inactive',
    company: companies[1],
    ...overrides,
  };
}

describe('LocationForm', () => {
  it('[AC-1] requires a name, limits it to 100 characters, validates optional phone and permits no Company', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <LocationForm
        companies={companies}
        submitLabel="Save Location"
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    const name = screen.getByLabelText(/Location name/);
    const phone = screen.getByLabelText(/Phone number/);
    const company = screen.getByLabelText(/Company/);
    expect(name).toHaveAttribute('maxLength', '100');
    expect(name).toBeRequired();
    expect(phone).not.toBeRequired();
    expect(company).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Active Health' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Former Health' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(screen.getByText('Enter a location name.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(name, 'Portland Clinic');
    await user.type(phone, 'call us');
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(phone);
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Portland Clinic',
      phone: '',
      companyId: '',
    }));
  });

  it('[AC-5] prepopulates saved fields and Company selection, and submits when the association is cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const saved = makeLocation();
    const values: LocationFormValues = locationToForm(saved);
    render(
      <LocationForm
        initialValues={values}
        companies={companies}
        submitLabel="Save Changes"
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByLabelText(/Location name/)).toHaveValue('Northside Clinic');
    expect(screen.getByLabelText(/Phone number/)).toHaveValue('+1 555 0100');
    expect(screen.getByLabelText('Country (optional)')).toHaveValue('United States');
    expect(screen.getByLabelText('State / Province (optional)')).toHaveValue('Oregon');
    expect(screen.getByLabelText('City (optional)')).toHaveValue('Portland');
    const company = screen.getByLabelText(/Company/);
    expect(company).toHaveValue('company-inactive');
    expect(screen.getByRole('option', { name: /Former Health.*Inactive/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Active Health' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear selected company' }));
    expect(company).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Northside Clinic',
      country: 'United States',
      stateProvince: 'Oregon',
      city: 'Portland',
      companyId: '',
    }));
  });
});
