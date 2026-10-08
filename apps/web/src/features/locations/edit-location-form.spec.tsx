import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditLocationPage from '@/app/(app)/locations/[id]/edit/page';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const existingLocation = {
  id: 'loc-42',
  name: 'Northfield Distribution',
  companyId: 'company-1',
  company: { id: 'company-1', name: 'Acme Group' },
  phone: '(612) 555-0184',
  contactPerson: 'Jordan Lee',
  contactPersonPhone: '(612) 555-0199',
  addressLine1: '4820 Industrial Parkway',
  addressLine2: 'Building C',
  country: 'United States',
  stateProvince: 'Minnesota',
  city: 'Northfield',
  postalCode: '55057',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const activeCompanies = {
  data: [{
    id: 'company-1', name: 'Acme Group', phone: '5551234567', email: null, website: null,
    billingAddress: {}, shippingSameAsBilling: true, shippingAddress: {}, isActive: true,
    createdAt: '', updatedAt: '', createdById: null, updatedById: null,
  }],
  total: 1,
  page: 1,
  perPage: 100,
};

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function installFetch() {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/companies')) return jsonResponse(activeCompanies);
    if (url.includes('/locations/loc-42') && init?.method === 'PATCH') return jsonResponse(existingLocation);
    if (url.includes('/locations/loc-42')) return jsonResponse(existingLocation);
    return jsonResponse({}, 404);
  }) as jest.Mock;
}

beforeEach(() => {
  push.mockClear();
  sessionStorage.clear();
  installFetch();
});

describe('Edit Location form', () => {
  it('[AC-5] pre-populates existing Company, contact, and address values', async () => {
    render(<EditLocationPage params={{ id: 'loc-42' }} />);

    expect(await screen.findByRole('heading', { name: 'Edit Location' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Location name/)).toHaveValue('Northfield Distribution');
    expect(screen.getByLabelText('Location phone')).toHaveValue('(612) 555-0184');
    expect(screen.getByLabelText('Contact Person')).toHaveValue('Jordan Lee');
    expect(screen.getByLabelText('Contact Person phone')).toHaveValue('(612) 555-0199');
    expect(screen.getByLabelText('Address line 1')).toHaveValue('4820 Industrial Parkway');
    expect(screen.getByLabelText('Address line 2')).toHaveValue('Building C');
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('United States');
    expect(screen.getByRole('combobox', { name: 'State/Province' })).toHaveValue('Minnesota');
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue('Northfield');
    expect(screen.getByLabelText('Postal code')).toHaveValue('55057');
    expect(await screen.findByText('Selected: Acme Group')).toBeInTheDocument();
  });

  it('[AC-7] PATCHes valid changes and navigates to Location Details with success confirmation', async () => {
    const user = userEvent.setup();
    render(<EditLocationPage params={{ id: 'loc-42' }} />);

    const name = await screen.findByLabelText(/^Location name/);
    await user.clear(name);
    await user.type(name, 'Northfield Distribution West');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(
      '/locations/loc-42?success=Location%20updated%20successfully.',
    ));
    expect(sessionStorage.getItem('location-success')).toBe('Location updated successfully.');
    const patchRequest = (global.fetch as jest.Mock).mock.calls.find(([, options]) => options?.method === 'PATCH');
    expect(patchRequest).toBeDefined();
    expect(JSON.parse(patchRequest[1].body as string)).toEqual(expect.objectContaining({
      name: 'Northfield Distribution West',
      companyId: 'company-1',
      addressLine1: '4820 Industrial Parkway',
      addressLine2: 'Building C',
      country: 'United States',
      stateProvince: 'Minnesota',
      city: 'Northfield',
      postalCode: '55057',
    }));
  });
});
