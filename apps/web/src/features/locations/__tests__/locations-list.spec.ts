import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationsPage from '@/app/(app)/locations/page'
import { LocationsTable } from '@/features/locations/locations-table'

jest.mock('next/link', () => {
  const React = require('react')
  function Link(props: any) {
    return React.createElement('a', { href: props.href }, props.children)
  }
  return { __esModule: true, default: Link }
})

// Mock the API layer so list queries don't hit the network
jest.mock('@/lib/api', () => {
  const buildQuery = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v))
    const q = search.toString()
    return q ? `?${q}` : ''
  }
  return { apiFetch: jest.fn(), buildQuery }
})

function makeLocation(overrides: Partial<{ id: string; name: string; companyId: string | null; status: 'ACTIVE' | 'INACTIVE' } > = {}) {
  return {
    id: 'loc-1',
    name: 'Sydney Office',
    companyId: null,
    status: 'ACTIVE' as const,
    ...overrides,
  }
}

function paged(data: any[]) {
  return { data, total: data.length, page: 1, perPage: 50 }
}

it('[AC-6]', async () => {
  // Simulate a successful add redirect (page reads this flag and shows a toast)
  window.sessionStorage.setItem('nbryo.locations.added', '1')
  const { apiFetch } = (await import('@/lib/api')) as any
  ;(apiFetch as jest.Mock).mockResolvedValueOnce(paged([makeLocation()]))

  render(React.createElement(LocationsPage))

  expect(await screen.findByText('Location added successfully')).toBeInTheDocument()
})

it('[AC-15]', () => {
  render(
    React.createElement(LocationsTable, {
      locations: [
        makeLocation({ id: 'a', name: 'Alpha', companyId: null, status: 'ACTIVE' }),
        makeLocation({ id: 'b', name: 'Beta', companyId: 'comp-123', status: 'INACTIVE' }),
      ],
    }),
  )

  expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()

  // When no company is linked, show a dash
  expect(screen.getAllByText('-')[0]).toBeInTheDocument()

  // Status shows a dot + text label
  expect(screen.getByLabelText('Active')).toBeInTheDocument()
  expect(screen.getByText('Active')).toBeInTheDocument()
  expect(screen.getByLabelText('Inactive')).toBeInTheDocument()
  expect(screen.getByText('Inactive')).toBeInTheDocument()
})

it('[AC-18]', async () => {
  const { apiFetch } = (await import('@/lib/api')) as any
  ;(apiFetch as jest.Mock).mockResolvedValueOnce(paged([]))

  render(React.createElement(LocationsPage))

  await waitFor(() => expect(screen.getByText('No locations found.')).toBeInTheDocument())
})

it('[AC-20]', async () => {
  const user = userEvent.setup()
  const { apiFetch } = (await import('@/lib/api')) as any
  ;(apiFetch as jest.Mock).mockResolvedValue(paged([]))

  render(React.createElement(LocationsPage))

  // Change filters and apply
  await user.selectOptions(screen.getByLabelText('Status'), 'ALL')
  await user.type(screen.getByLabelText('Country'), 'Australia')
  await user.type(screen.getByLabelText('Company'), 'uuid-1234')

  await user.click(screen.getByRole('button', { name: 'Apply' }))

  // The latest call should include the chosen filters
  const calls = (apiFetch as jest.Mock).mock.calls as [string][]
  const lastPath = calls[calls.length - 1][0] as string
  expect(lastPath).toContain('/locations')
  expect(lastPath).toContain('status=ALL')
  expect(lastPath).toContain('country=Australia')
  expect(lastPath).toContain('company=uuid-1234')
})

it('[AC-21]', async () => {
  const user = userEvent.setup()
  const { apiFetch } = (await import('@/lib/api')) as any
  ;(apiFetch as jest.Mock).mockResolvedValue(paged([]))

  render(React.createElement(LocationsPage))

  // Enter some values
  await user.type(screen.getByLabelText('Search locations'), 'syd')
  await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE')
  await user.type(screen.getByLabelText('Country'), 'NZ')
  await user.type(screen.getByLabelText('Company'), 'uuid-zzz')

  // Reset
  await user.click(screen.getByRole('button', { name: 'Reset Filters' }))

  // Back to defaults (search cleared, Active status, perPage 50)
  expect(screen.getByLabelText('Search locations')).toHaveValue('')
  expect(screen.getByLabelText('Status')).toHaveValue('ACTIVE')

  const calls = (apiFetch as jest.Mock).mock.calls as [string][]
  const lastPath = calls[calls.length - 1][0] as string
  expect(lastPath).toContain('status=ACTIVE')
  expect(lastPath).toContain('perPage=50')
  expect(lastPath).not.toContain('country=')
  expect(lastPath).not.toContain('company=')
  expect(lastPath).not.toContain('search=')
})

it('[AC-22]', async () => {
  const user = userEvent.setup()
  const { apiFetch } = (await import('@/lib/api')) as any
  ;(apiFetch as jest.Mock).mockResolvedValue(paged([]))

  render(React.createElement(LocationsPage))

  // Initially 0
  expect(screen.getByText('Filters (0)')).toBeInTheDocument()

  // Apply 2 filters (Country + Company)
  await user.type(screen.getByLabelText('Country'), 'AU')
  await user.type(screen.getByLabelText('Company'), 'uuid-1')
  expect(screen.getByText('Filters (2)')).toBeInTheDocument()

  // Reset goes back to (0)
  await user.click(screen.getByRole('button', { name: 'Reset Filters' }))
  expect(screen.getByText('Filters (0)')).toBeInTheDocument()
})
