import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm, LocationRecord, locationToForm } from './location-form';
import { apiFetch } from '@/lib/api';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  apiFetch: jest.fn(),
}));

const companyRows = [
  { id: 'active-co', name: 'Active Health', isActive: true },
];

beforeEach(() => {
  jest.clearAllMocks();
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path.startsWith('/companies')) return Promise.resolve({ data: companyRows, total: 1, page: 1, perPage: 100 });
    return Promise.resolve({ id: 'location-1' });
  });
});

describe('Location form', () => {
  it('[AC-1] requires a name, caps it at 100 characters, and supports optional phone and Company', async () => {
    const user = userEvent.setup();
    render(<LocationForm submitLabel="Save Location" />);

    expect(screen.getByLabelText(/^Location name/)).toBeRequired();
    expect(screen.getByLabelText(/^Location name/)).toHaveAttribute('maxLength', '100');
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
    const company = await screen.findByRole('combobox', { name: 'Company (optional)' });
    expect(company).toHaveValue('');
    expect(await screen.findByRole('option', { name: 'Active Health' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(await screen.findByText('Enter a location name.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalledWith('/locations', expect.objectContaining({ method: 'POST' }));

    fireEvent.change(screen.getByLabelText(/^Location name/), { target: { value: 'A'.repeat(100) } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: 'bad phone' } });
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    expect(await screen.findByText('Enter a valid phone number.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalledWith('/locations', expect.objectContaining({ method: 'POST' }));

    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+1 555 0100' } });
    await user.click(screen.getByRole('button', { name: 'Save Location' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/locations', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ name: 'A'.repeat(100), phone: '+1 555 0100', companyId: null }),
    })));
  });

  it('[AC-5] prepopulates saved values and retains, changes, or clears an inactive Company association', async () => {
    const user = userEvent.setup();
    const saved: LocationRecord = {
      id: 'loc-123',
      name: 'Northside Clinic',
      phone: '+1 555 0100',
      country: 'United States',
      stateProvince: 'Oregon',
      city: 'Portland',
      companyId: 'inactive-co',
      company: { id: 'inactive-co', name: 'Cedar Health Group', isActive: false },
    };
    expect(locationToForm(saved)).toMatchObject({ name: saved.name, companyId: 'inactive-co' });
    render(<LocationForm locationId={saved.id} initialLocation={saved} submitLabel="Save Changes" />);

    expect(screen.getByLabelText(/^Location name/)).toHaveValue('Northside Clinic');
    expect(screen.getByLabelText('Phone number')).toHaveValue('+1 555 0100');
    expect(screen.getByLabelText('Country')).toHaveValue('United States');
    expect(screen.getByLabelText('State / Province')).toHaveValue('Oregon');
    expect(screen.getByLabelText('City')).toHaveValue('Portland');
    const company = await screen.findByRole('combobox', { name: 'Company (optional)' });
    expect(company).toHaveValue('inactive-co');
    expect(screen.getByRole('option', { name: 'Cedar Health Group (Inactive — current selection)' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Active Health' })).toBeInTheDocument();

    await user.selectOptions(company, 'active-co');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/locations/loc-123', expect.objectContaining({
      method: 'PATCH',
      body: expect.objectContaining({ name: 'Northside Clinic', country: 'United States', companyId: 'active-co' }),
    })));

    await user.selectOptions(company, '');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/locations/loc-123', expect.objectContaining({
      method: 'PATCH',
      body: expect.objectContaining({ companyId: null }),
    })));
  });
});
