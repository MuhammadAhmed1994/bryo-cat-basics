import { render, screen } from '@testing-library/react';
import Page from '@/app/(app)/locations/[id]/page';
import { apiFetch } from '@/lib/api';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

describe('Location Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParams.forEach((_, key) => searchParams.delete(key));
  });

  it('[AC-13] shows a success toast on arrival from edit', async () => {
    searchParams.set('updated', '1');

    mockApiFetch.mockImplementation((path: string) => {
      if (path.startsWith('/locations/')) {
        return Promise.resolve({
          id: 'loc-1',
          name: 'Sydney Office',
          companyId: null,
          phone: null,
          contactPersonName: null,
          contactPersonPhone: null,
          addressLine1: null,
          addressLine2: null,
          country: null,
          stateProvince: null,
          city: null,
          postalCode: null,
          status: 'ACTIVE',
        } as never);
      }
      return Promise.resolve(undefined as never);
    });

    render(<Page params={{ id: 'loc-1' }} />);

    expect(await screen.findByText('Location updated successfully')).toBeInTheDocument();
  });

  it('[AC-16] renders read-only fields correctly with placeholders and shows status dot + label', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === '/locations/loc-1') {
        return Promise.resolve({
          id: 'loc-1',
          name: 'Sydney Office',
          companyId: 'co-1',
          phone: '+61 2 9123 4567',
          contactPersonName: 'Dana Whitfield',
          contactPersonPhone: '', // empty should render '-'
          addressLine1: '42 Harbour Road',
          addressLine2: null, // should render '-'
          country: 'Australia',
          stateProvince: 'New South Wales',
          city: 'Sydney',
          postalCode: '2000',
          status: 'ACTIVE',
        } as never);
      }
      if (path === '/companies/co-1') {
        return Promise.resolve({ id: 'co-1', name: 'Acme Cattle Co.', isActive: true } as never);
      }
      return Promise.resolve(undefined as never);
    });

    render(<Page params={{ id: 'loc-1' }} />);

    // H1 title
    expect(await screen.findByRole('heading', { level: 1, name: 'Sydney Office' })).toBeInTheDocument();

    // Status dot + label
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Helper to read the value next to a dt label
    function valueFor(label: string): string {
      const dt = screen.getByText(label, { selector: 'dt' });
      const dd = dt.parentElement?.querySelector('dd') as HTMLElement | null;
      return dd?.textContent ?? '';
    }

    expect(valueFor('Company')).toBe('Acme Cattle Co.');
    expect(valueFor('Phone')).toBe('+61 2 9123 4567');
    expect(valueFor('Contact Person')).toBe('Dana Whitfield');
    expect(valueFor('Contact Person Phone')).toBe('-');

    expect(valueFor('Address Line 1')).toBe('42 Harbour Road');
    expect(valueFor('Address Line 2')).toBe('-');
    expect(valueFor('City')).toBe('Sydney');
    expect(valueFor('State/Province')).toBe('New South Wales');
    expect(valueFor('Country')).toBe('Australia');
    expect(valueFor('Postal Code')).toBe('2000');
  });
});
