import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Company } from '@/lib/types';
import { LocationForm } from './location-form';

const companies = [
  { id: 'company-active', name: 'Active Company', isActive: true },
  { id: 'company-inactive', name: 'Inactive Company', isActive: false },
] as Company[];

describe('LocationForm', () => {
  it('[AC-1] validates required and maximum-length name', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LocationForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(screen.getByText('Location name is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Location name/), {
      target: { value: 'x'.repeat(101) },
    });
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(screen.getByText('Location name must be 100 characters or fewer.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('[AC-5] offers active Companies only', () => {
    render(<LocationForm companies={companies} onSubmit={jest.fn()} />);

    const selector = screen.getByLabelText('Company');
    expect(screen.getByRole('option', { name: 'Active Company' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inactive Company' })).not.toBeInTheDocument();
    expect(selector).toHaveValue('');
  });

  it('[AC-7] enforces and clears hierarchy dependencies', async () => {
    const user = userEvent.setup();
    render(<LocationForm onSubmit={jest.fn()} />);

    const country = screen.getByRole('combobox', { name: 'Country' });
    const state = screen.getByRole('combobox', { name: 'State / Province' });
    const city = screen.getByRole('combobox', { name: 'City' });
    expect(state).toBeDisabled();
    expect(city).toBeDisabled();

    await user.type(country, 'Canada');
    expect(state).toBeEnabled();
    expect(city).toBeDisabled();
    await user.type(state, 'Ontario');
    expect(city).toBeEnabled();
    await user.type(city, 'Toronto');

    await user.clear(country);
    await user.type(country, 'United States');
    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(city).toBeDisabled();

    await user.type(state, 'California');
    await user.type(city, 'Oakland');
    await user.clear(state);
    await user.type(state, 'Nevada');
    expect(city).toHaveValue('');
  });

  it('[AC-11] preserves edit hierarchy and applies dependent-selector clearing', async () => {
    const user = userEvent.setup();
    render(
      <LocationForm
        initialValues={{ country: 'Canada', stateProvince: 'Ontario', city: 'Toronto' }}
        onSubmit={jest.fn()}
      />,
    );

    const country = screen.getByRole('combobox', { name: 'Country' });
    const state = screen.getByRole('combobox', { name: 'State / Province' });
    const city = screen.getByRole('combobox', { name: 'City' });
    expect(country).toHaveValue('Canada');
    expect(state).toHaveValue('Ontario');
    expect(city).toHaveValue('Toronto');
    expect(state).toBeEnabled();
    expect(city).toBeEnabled();

    await user.clear(country);
    await user.type(country, 'United States');
    expect(state).toHaveValue('');
    expect(city).toHaveValue('');
    expect(city).toBeDisabled();

    await user.type(state, 'California');
    await user.type(city, 'Oakland');
    await user.clear(state);
    await user.type(state, 'Nevada');
    expect(city).toHaveValue('');
  });
});
