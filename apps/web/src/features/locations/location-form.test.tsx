import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Company } from '@/lib/types';
import { LocationForm, LocationFormValues } from './location-form';

function company(id: string, name: string, isActive: boolean): Company {
  return { id, name, isActive } as Company;
}

const savedValues: Partial<LocationFormValues> = {
  name: 'Northstar Distribution Center',
  country: 'United States',
  stateProvince: 'California',
  city: 'Oakland',
  companyId: 'active-company',
};

describe('LocationForm acceptance criteria', () => {
  it('[AC-1] requires a name and rejects a name longer than 100 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const { rerender } = render(<LocationForm submitLabel="Save Location" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(screen.getByText('Location name is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    const name = screen.getByRole('textbox', { name: /Location name/ });
    fireEvent.change(name, { target: { value: 'x'.repeat(101) } });
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(screen.getByText('Name cannot exceed 100 characters.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(<LocationForm key="valid-name" submitLabel="Save Location" onSubmit={onSubmit} initialValues={{ name: 'x'.repeat(100) }} />);
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('[AC-5] offers active Companies only in the optional Company selector', () => {
    render(
      <LocationForm
        submitLabel="Save"
        onSubmit={jest.fn()}
        companies={[
          company('active-company', 'Active Company', true),
          company('inactive-company', 'Inactive Company', false),
        ]}
      />,
    );

    const selector = screen.getByRole('combobox', { name: 'Company' });
    expect(selector).toContainHTML('<option value="active-company">Active Company</option>');
    expect(selector).not.toContainHTML('Inactive Company');
    expect(screen.getByRole('option', { name: 'No company' })).toBeInTheDocument();
  });

  it('[AC-7] disables dependent fields until selected and clears descendants on parent changes', async () => {
    const user = userEvent.setup();
    render(<LocationForm submitLabel="Save" onSubmit={jest.fn()} />);
    const country = screen.getByLabelText('Country');
    const state = screen.getByLabelText('State/Province');
    const city = screen.getByLabelText('City');

    expect(state).toBeDisabled();
    expect(city).toBeDisabled();
    await user.type(country, 'Canada');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();
    await user.type(state, 'Ontario');
    expect(city).toBeEnabled();
    await user.type(city, 'Toronto');

    await user.clear(state);
    expect(city).toHaveValue('');
    await user.type(state, 'Quebec');
    await user.type(city, 'Montreal');
    await user.clear(country);
    await user.type(country, 'United States');

    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();
  });

  it('[AC-11] displays saved edit hierarchy and applies identical dependency clearing', async () => {
    const user = userEvent.setup();
    render(
      <LocationForm
        submitLabel="Save Changes"
        onSubmit={jest.fn()}
        initialValues={savedValues}
        companies={[company('active-company', 'Active Company', true)]}
      />,
    );

    const country = screen.getByLabelText('Country');
    const state = screen.getByLabelText('State/Province');
    const city = screen.getByLabelText('City');
    expect(country).toHaveValue('United States');
    expect(state).toHaveValue('California');
    expect(city).toHaveValue('Oakland');
    expect(state).toBeEnabled();
    expect(city).toBeEnabled();
    expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue('active-company');

    await user.clear(country);
    await user.type(country, 'Canada');
    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(city).toBeDisabled();

    await user.type(state, 'Ontario');
    await user.type(city, 'Toronto');
    await user.clear(state);
    expect(city).toHaveValue('');
    expect(city).toBeDisabled();
  });
});
