import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import LocationDetailsPage from '@/app/(app)/locations/[id]/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    React.createElement('a', { href }, children)
  ),
}))

// Mock the API helper so the page doesn't actually call the backend
const apiFetchMock = jest.fn()
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api') as typeof import('@/lib/api')
  return {
    ...actual,
    apiFetch: (...args: any[]) => (apiFetchMock as any)(...args),
  }
})

describe('Location Details', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
  })

  it('[AC-13]', async () => {
    apiFetchMock.mockResolvedValueOnce({
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
    })

    // Simulate arriving from /locations/:id/edit
    window.history.replaceState({}, '', '/locations/loc-1?updated=1')

    render(React.createElement(LocationDetailsPage, { params: { id: 'loc-1' } }))

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())

    expect(screen.getByRole('status')).toHaveTextContent('Location updated successfully')
  })

  it('[AC-16]', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 'loc-2',
      name: 'Sydney Office',
      companyId: null, // renders '-'
      phone: '+61 2 9123 4567',
      contactPersonName: 'Dana Whitfield',
      contactPersonPhone: null, // renders '-'
      addressLine1: '42 Harbour Road',
      addressLine2: null, // renders '-'
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: null, // renders '-'
      postalCode: null, // renders '-'
      status: 'ACTIVE',
    })

    render(React.createElement(LocationDetailsPage, { params: { id: 'loc-2' } }))

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())

    // H1 title
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sydney Office' })
    ).toBeInTheDocument()

    // Status dot + label
    expect(screen.getByLabelText('Active')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    // Read-only fields and placeholders
    expect(screen.getByText('+61 2 9123 4567')).toBeInTheDocument()
    expect(screen.getByText('Dana Whitfield')).toBeInTheDocument()
    expect(screen.getByText('42 Harbour Road')).toBeInTheDocument()
    expect(screen.getByText('New South Wales')).toBeInTheDocument()
    expect(screen.getByText('Australia')).toBeInTheDocument()

    // Five optional fields render as '-': Company, Contact Person Phone, Address Line 2, City, Postal Code
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(5)
  })
})
