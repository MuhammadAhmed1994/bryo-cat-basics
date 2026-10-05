import React from 'react';
import { render, screen, within } from '@testing-library/react';
import LocationDetailsPage from '@/app/(app)/locations/[id]/page';

// Mock API helper
jest.mock('@/lib/api', () => {
  return { apiFetch: jest.fn() };
});
const { apiFetch } = jest.requireMock('@/lib/api') as { apiFetch: jest.Mock };

// Mock useSearchParams to control query flags
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return { ...actual, useSearchParams: jest.fn(() => new URLSearchParams('')) };
});
const { useSearchParams } = jest.requireMock('next/navigation') as { useSearchParams: jest.Mock };

describe('Location Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSearchParams.mockReturnValue(new URLSearchParams(''));
  });

  it('[AC-13] shows success toast after edit when redirected with updated flag', async () => {
    // minimal location payload
    apiFetch.mockResolvedValueOnce({
      id: 'loc_1',
      name: 'Edited Name',
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
    });

    useSearchParams.mockReturnValue(new URLSearchParams('updated=1'));

    render(<LocationDetailsPage params={{ id: 'loc_1' }} />);

    expect(await screen.findByText('Location updated successfully')).toBeInTheDocument();
  });

  it('[AC-16] renders all read-only fields with values and dashes for missing, plus status dot + label', async () => {
    apiFetch.mockResolvedValueOnce({
      id: 'loc_2',
      name: 'Sydney Office',
      companyId: null,
      phone: '+61 2 9000 0000',
      contactPersonName: 'Dana Whitfield',
      contactPersonPhone: '+61 400 000 000',
      addressLine1: '42 Harbour Road',
      addressLine2: null, // should show '-'
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Sydney',
      postalCode: '2000',
      status: 'ACTIVE',
    });

    render(<LocationDetailsPage params={{ id: 'loc_2' }} />);

    // Wait for header to render with the name
    expect(await screen.findByRole('heading', { name: /Sydney Office/i })).toBeInTheDocument();

    // Status label present alongside the dot
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Company shows '-' when none
    const companyLabel = screen.getByText('Company');
    const companyRow = companyLabel.closest('div')!;
    expect(within(companyRow).getByText('-')).toBeInTheDocument();

    // Contact/phone fields show their values
    expect(screen.getByText('+61 2 9000 0000')).toBeInTheDocument();
    expect(screen.getByText('Dana Whitfield')).toBeInTheDocument();
    expect(screen.getByText('+61 400 000 000')).toBeInTheDocument();

    // Address section fields
    expect(screen.getByText('42 Harbour Road')).toBeInTheDocument();

    const addr2Label = screen.getByText('Address Line 2');
    const addr2Row = addr2Label.closest('div')!;
    expect(within(addr2Row).getByText('-')).toBeInTheDocument();

    expect(screen.getByText('Sydney')).toBeInTheDocument();
    expect(screen.getByText('New South Wales')).toBeInTheDocument();
    expect(screen.getByText('Australia')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });
});
