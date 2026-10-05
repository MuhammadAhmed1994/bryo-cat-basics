import React from 'react'
import { render, screen } from '@testing-library/react'
import Page from '../../../app/(app)/locations/[id]/page'

// Mock the API helper used by the page
const mockApi = jest.requireMock('@/lib/api')

jest.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
      this.name = 'ApiError'
    }
  }
  return {
    ApiError,
    apiFetch: jest.fn(),
  }
})

const apiFetch: jest.Mock = mockApi.apiFetch

function buildLocation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
    postalCode: '2000',
    status: 'ACTIVE',
    ...overrides,
  }
}

describe('[AC-13] success toast on arrival from edit', () => {
  it('[AC-13] shows a success toast with exact message on arrival from edit', async () => {
    apiFetch.mockResolvedValueOnce(buildLocation())

    render(
      React.createElement(Page as any, {
        params: { id: 'loc-1' },
        searchParams: { success: '1' },
      }),
    )

    // Wait for load to complete
    await screen.findByRole('heading', { level: 1, name: 'Sydney Office' })

    // Toast appears with the exact required message
    expect(screen.getByRole('status')).toHaveTextContent('Location updated successfully')
  })
})

describe('[AC-16] read-only fields and status', () => {
  it('[AC-16] renders all read-only fields with placeholders and the status dot + label', async () => {
    apiFetch.mockResolvedValueOnce(buildLocation({
      phone: '',
      contactPersonName: '',
      contactPersonPhone: '',
      addressLine1: '',
      addressLine2: '',
      country: '',
      stateProvince: '',
      city: '',
      postalCode: '2000',
      status: 'ACTIVE',
    }))

    render(
      React.createElement(Page as any, {
        params: { id: 'loc-1' },
        searchParams: {},
      }),
    )

    // Name as H1
    expect(await screen.findByRole('heading', { level: 1, name: 'Sydney Office' })).toBeInTheDocument()

    // Status shown as dot (aria-label) and visible text label
    expect(screen.getByLabelText('Active')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    // Read-only fields with '-' placeholders for empty values
    expect(screen.getByText('Company')).toBeInTheDocument()
    // Company shows '-' when none
    // There may be many '-' values; assert at least one following a label context by counting occurrences
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(7)

    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Contact Person')).toBeInTheDocument()
    expect(screen.getByText('Contact Person Phone')).toBeInTheDocument()

    expect(screen.getByText('Address Line 1')).toBeInTheDocument()
    expect(screen.getByText('Address Line 2')).toBeInTheDocument()
    expect(screen.getByText('City')).toBeInTheDocument()
    expect(screen.getByText('State/Province')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Postal Code')).toBeInTheDocument()

    // A concrete non-empty value renders as-is
    expect(screen.getByText('2000')).toBeInTheDocument()
  })
})
