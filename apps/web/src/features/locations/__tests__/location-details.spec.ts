import React from 'react';
import { render, screen, within } from '@testing-library/react';
import LocationDetailsPage from '@/app/(app)/locations/[id]/page';
import { apiFetch } from '@/lib/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { href: string; children: React.ReactNode }) => children as any,
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('Location Details page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('[AC-13] shows success toast on arrival from edit', async () => {
    // minimal location; companyId null avoids extra company fetch
    mockApiFetch.mockResolvedValueOnce({
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

    window.history.pushState({}, '', '/locations/loc-1?updated=1');

    render(React.createElement(LocationDetailsPage as any, { params: { id: 'loc-1' } }));

    // There may be multiple role=status (spinner + toast); look for the toast message specifically
    const statuses = await screen.findAllByRole('status');
    expect(statuses.some((el) => el.textContent?.includes('Location updated successfully'))).toBe(
      true,
    );
  });

  it('[AC-16] renders read-only fields with placeholders and status dot + label', async () => {
    mockApiFetch.mockResolvedValueOnce({
      id: 'loc-2',
      name: 'North Depot',
      companyId: null, // no company -> '-'
      phone: '+1 555 0100',
      contactPersonName: 'Dana Whitfield',
      contactPersonPhone: null, // -> '-'
      addressLine1: '42 Harbour Road',
      addressLine2: '', // empty string -> '-'
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Sydney',
      postalCode: null, // -> '-'
      status: 'ACTIVE',
    } as never);

    render(React.createElement(LocationDetailsPage as any, { params: { id: 'loc-2' } }));

    // Name as the page title
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('North Depot');

    // Status dot + label
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Details card values
    const companyLabel = screen.getByText('Company');
    expect(within(companyLabel.parentElement as HTMLElement).getByText('-')).toBeInTheDocument();

    const phoneLabel = screen.getByText('Phone');
    expect(
      within(phoneLabel.parentElement as HTMLElement).getByText('+1 555 0100'),
    ).toBeInTheDocument();

    const contactLabel = screen.getByText('Contact Person');
    expect(
      within(contactLabel.parentElement as HTMLElement).getByText('Dana Whitfield'),
    ).toBeInTheDocument();

    const contactPhoneLabel = screen.getByText('Contact Person Phone');
    expect(within(contactPhoneLabel.parentElement as HTMLElement).getByText('-')).toBeInTheDocument();

    // Address card values
    expect(
      within(screen.getByText('Address Line 1').parentElement as HTMLElement).getByText(
        '42 Harbour Road',
      ),
    ).toBeInTheDocument();

    expect(
      within(screen.getByText('Address Line 2').parentElement as HTMLElement).getByText('-'),
    ).toBeInTheDocument();

    expect(
      within(screen.getByText('City').parentElement as HTMLElement).getByText('Sydney'),
    ).toBeInTheDocument();

    expect(
      within(screen.getByText('State/Province').parentElement as HTMLElement).getByText('NSW'),
    ).toBeInTheDocument();

    expect(
      within(screen.getByText('Country').parentElement as HTMLElement).getByText('Australia'),
    ).toBeInTheDocument();

    expect(
      within(screen.getByText('Postal Code').parentElement as HTMLElement).getByText('-'),
    ).toBeInTheDocument();
  });
});
