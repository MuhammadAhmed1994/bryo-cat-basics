import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import LocationDetailsPage from '@/app/(app)/locations/[id]/page'

// Mock Next's Link to a simple anchor for test environment
jest.mock('next/link', () => {
  const React = require('react')
  function Link(props: any) {
    return React.createElement('a', { href: props.href }, props.children)
  }
  return { __esModule: true, default: Link }
})

// Mock the API layer
jest.mock('@/lib/api', () => {
  return { apiFetch: jest.fn() }
})

function makeLocation(overrides: Partial<{
  id: string
  name: string
  companyId: string | null
  phone: string | null
  contactPersonName: string | null
  contactPersonPhone: string | null
  addressLine1: string | null
  addressLine2: string | null
  country: string | null
  stateProvince: string | null
  city: string | null
  postalCode: string | null
  status: 'ACTIVE' | 'INACTIVE'
}> = {}) {
  return {
    id: 'loc-1',
    name: 'Sydney Office',
    companyId: null,
    phone: '+61 2 9123 4567',
    contactPersonName: 'Dana Whitfield',
    contactPersonPhone: '+61 412 345 678',
    addressLine1: '42 Harbour Road',
    addressLine2: null,
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Sydney',
    postalCode: '2000',
    status: 'ACTIVE' as const,
    ...overrides,
  }
}

it('[AC-13]', async () => {
  const { apiFetch } = (await import('@/lib/api')) as any
  ;(apiFetch as jest.Mock).mockResolvedValueOnce(makeLocation())

  // Simulate arrival from edit: page reads this flag and shows a toast
  window.sessionStorage.setItem('nbryo.locations.updated', '1')

  render(React.createElement(LocationDetailsPage, { params: { id: 'loc-1' } }))

  expect(await screen.findByText('Location updated successfully')).toBeInTheDocument()
})

it('[AC-16]', async () => {
  const { apiFetch } = (await import('@/lib/api')) as any
  // First call: GET /locations/:id
  ;(apiFetch as jest.Mock).mockResolvedValueOnce(
    makeLocation({
      companyId: 'comp-1',
      status: 'INACTIVE',
      addressLine2: null, // placeholder '-'
      contactPersonPhone: null, // placeholder '-'
    }),
  )
  // Second call: GET /companies/:id -> name for the company field
  ;(apiFetch as jest.Mock).mockResolvedValueOnce({ id: 'comp-1', name: 'Acme Cattle Co.', isActive: true })

  render(React.createElement(LocationDetailsPage, { params: { id: 'loc-1' } }))

  // Name as H1
  expect(await screen.findByRole('heading', { level: 1, name: 'Sydney Office' })).toBeInTheDocument()

  // Status dot + label
  expect(screen.getByLabelText('Inactive')).toBeInTheDocument()
  expect(screen.getByText('Inactive')).toBeInTheDocument()

  // Company name (fetched)
  expect(await screen.findByText('Acme Cattle Co.')).toBeInTheDocument()

  // Phone and Contact Person
  expect(screen.getByText('+61 2 9123 4567')).toBeInTheDocument()
  expect(screen.getByText('Dana Whitfield')).toBeInTheDocument()

  // Optional fields with '-' placeholder
  // Contact Person Phone and Address Line 2 are null in the payload
  // There will be multiple '-' on the page; ensure at least one exists
  expect(screen.getAllByText('-').length).toBeGreaterThan(0)

  // Address fields
  expect(screen.getByText('42 Harbour Road')).toBeInTheDocument()
  expect(screen.getByText('Sydney')).toBeInTheDocument()
  expect(screen.getByText('New South Wales')).toBeInTheDocument()
  expect(screen.getByText('Australia')).toBeInTheDocument()
  expect(screen.getByText('2000')).toBeInTheDocument()
})
