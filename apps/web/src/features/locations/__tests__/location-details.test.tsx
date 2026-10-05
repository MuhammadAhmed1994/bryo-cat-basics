import { render, screen, within } from '@testing-library/react';
import LocationDetailsPage from '@/app/(app)/locations/[id]/page';
import { apiFetch } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: (key: string) => null }),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

beforeEach(() => {
  mockApiFetch.mockReset();
});

it("[AC-13] displays a success toast on arrival from edit", async () => {
  // Mock search param updated=1 for this test only
  (jest.requireMock('next/navigation') as any).useSearchParams = () => ({
    get: (key: string) => (key === 'updated' ? '1' : null),
  });

  // First call: GET /locations/:id
  mockApiFetch.mockResolvedValueOnce({
    id: 'loc-1',
    name: 'Sydney Office',
    companyId: null,
    phone: '+61 2 9000 0000',
    contactPersonName: 'Dana',
    contactPersonPhone: null,
    addressLine1: '42 Harbour Rd',
    addressLine2: null,
    country: 'Australia',
    stateProvince: 'NSW',
    city: 'Sydney',
    postalCode: '2000',
    status: 'ACTIVE',
  } as never);

  render(<LocationDetailsPage params={{ id: 'loc-1' }} />);

  expect(await screen.findByText('Location updated successfully')).toBeInTheDocument();
});

it("[AC-16] renders the listed read-only fields with '-' placeholders and status dot + label", async () => {
  // First call: GET /locations/:id
  mockApiFetch.mockResolvedValueOnce({
    id: 'loc-2',
    name: 'Newcastle Yard',
    companyId: 'comp-9',
    phone: '+61 2 9555 0000',
    contactPersonName: 'Sam Taylor',
    contactPersonPhone: null, // placeholder '-'
    addressLine1: '7 Wharf Street',
    addressLine2: null, // placeholder '-'
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Newcastle',
    postalCode: '2300',
    status: 'INACTIVE',
  } as never);

  // Second call: GET /companies/:id for Company label
  mockApiFetch.mockResolvedValueOnce({
    id: 'comp-9',
    name: 'Acme Cattle Co.',
    phone: '',
    email: null,
    website: null,
    billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    shippingSameAsBilling: true,
    shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
    isActive: true,
    createdAt: '',
    updatedAt: '',
    createdById: null,
    updatedById: null,
  } as never);

  render(<LocationDetailsPage params={{ id: 'loc-2' }} />);

  // Name in header
  expect(await screen.findByText('Newcastle Yard')).toBeInTheDocument();

  // Status dot + text label appear (StatusDot uses aria-label)
  expect(screen.getByLabelText('Inactive')).toBeInTheDocument();
  expect(screen.getByText('Inactive')).toBeInTheDocument();

  // Company label
  const compRow = screen.getByText('Company').closest('div')!;
  expect(within(compRow).getByText('Acme Cattle Co.')).toBeInTheDocument();

  // Phone and Contact Person
  const phoneRow = screen.getByText('Phone').closest('div')!;
  expect(within(phoneRow).getByText('+61 2 9555 0000')).toBeInTheDocument();
  const contactRow = screen.getByText('Contact Person').closest('div')!;
  expect(within(contactRow).getByText('Sam Taylor')).toBeInTheDocument();

  // Contact Person Phone shows '-'
  const contactPhoneRow = screen.getByText('Contact Person Phone').closest('div')!;
  expect(within(contactPhoneRow).getByText('-')).toBeInTheDocument();

  // Address fields and placeholders
  const a1 = screen.getByText('Address Line 1').closest('div')!;
  expect(within(a1).getByText('7 Wharf Street')).toBeInTheDocument();
  const a2 = screen.getByText('Address Line 2').closest('div')!;
  expect(within(a2).getByText('-')).toBeInTheDocument();
  expect(within(screen.getByText('City').closest('div')!).getByText('Newcastle')).toBeInTheDocument();
  expect(within(screen.getByText('State/Province').closest('div')!).getByText('New South Wales')).toBeInTheDocument();
  expect(within(screen.getByText('Country').closest('div')!).getByText('Australia')).toBeInTheDocument();
  expect(within(screen.getByText('Postal Code').closest('div')!).getByText('2300')).toBeInTheDocument();
});
