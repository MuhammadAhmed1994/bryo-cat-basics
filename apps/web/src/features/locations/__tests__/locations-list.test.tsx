import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationsPage from '@/app/(app)/locations/page'
import { LocationsTable } from '@/features/locations/locations-table'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
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

function paginated<T>(data: T[]) {
  return { data, total: data.length, page: 1, perPage: 50 }
}

describe('Locations List', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
  })

  it('[AC-6]', async () => {
    // Initial list request
    apiFetchMock.mockResolvedValueOnce(paginated([]))
    // Simulate arriving from /locations/new
    window.history.replaceState({}, '', '/locations?added=1')

    render(<LocationsPage />)

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())

    expect(screen.getByRole('status')).toHaveTextContent('Location added successfully')
  })

  it('[AC-15]', () => {
    render(
      <LocationsTable
        locations={[
          { id: 'loc-a', name: 'Sydney Office', status: 'ACTIVE', companyId: null },
          { id: 'loc-b', name: 'Perth Lab', status: 'INACTIVE', companyId: '550e8400-e29b-41d4-a716-446655440000' },
        ]}
        sortDir="ASC"
        onToggleSort={jest.fn()}
      />,
    )

    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()

    // Company column shows '-' when no company
    expect(screen.getAllByText('-')[0]).toBeInTheDocument()

    // Status shows dot + label for both Active and Inactive
    expect(screen.getByLabelText('Active')).toBeInTheDocument()
    expect(screen.getByLabelText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('[AC-18]', async () => {
    apiFetchMock.mockResolvedValueOnce(paginated([]))

    render(<LocationsPage />)

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())

    expect(screen.getByText('No locations found.')).toBeInTheDocument()
  })

  it('[AC-20]', async () => {
    const user = userEvent.setup()

    // First call: default list
    apiFetchMock.mockResolvedValueOnce(paginated([]))
    // Second call: after Apply
    apiFetchMock.mockResolvedValueOnce(paginated([]))

    render(<LocationsPage />)

    // Wait for initial load
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1))

    // Choose All status, set Country and Company, then Apply
    await user.selectOptions(screen.getByLabelText('Status'), 'ALL')
    await user.type(screen.getByLabelText('Country'), 'Australia')
    await user.type(
      screen.getByLabelText('Company'),
      '550e8400-e29b-41d4-a716-446655440000',
    )
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2))

    const [, secondCall] = apiFetchMock.mock.calls
    const url = secondCall[0] as string

    // Apply re-queries with the selected filters
    expect(url).toContain('/locations?')
    expect(url).toContain('status=ALL')
    expect(url).toContain('country=Australia')
    expect(url).toContain('company=550e8400-e29b-41d4-a716-446655440000')
  })

  it('[AC-21]', async () => {
    const user = userEvent.setup()

    // 1: initial load; 2: after search; 3: after Apply; 4: after Reset
    apiFetchMock
      .mockResolvedValueOnce(paginated([]))
      .mockResolvedValueOnce(paginated([]))
      .mockResolvedValueOnce(paginated([]))
      .mockResolvedValueOnce(paginated([]))

    render(<LocationsPage />)

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1))

    // Enter a search term and submit
    await user.type(screen.getByLabelText('Search locations'), 'syd')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2))

    // Set filters and Apply
    await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE')
    await user.type(screen.getByLabelText('Country'), 'AU')
    await user.type(screen.getByLabelText('Company'), '550e8400-e29b-41d4-a716-446655440000')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(3))

    // Now Reset Filters (use the first matching button in the toolbar)
    const resetButtons = screen.getAllByRole('button', { name: 'Reset Filters' })
    await user.click(resetButtons[0])

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(4))

    const lastCall = apiFetchMock.mock.calls[3]
    const url = lastCall[0] as string

    // Default state: Active, A→Z, page size 50, and empty search/country/company
    expect(url).toContain('status=ACTIVE')
    expect(url).toContain('sortDir=ASC')
    expect(url).toContain('perPage=50')
    expect(url).not.toContain('search=')
    expect(url).not.toContain('country=')
    expect(url).not.toContain('company=')
  })

  it('[AC-22]', async () => {
    const user = userEvent.setup()

    apiFetchMock.mockResolvedValue(paginated([]))

    render(<LocationsPage />)

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())

    // Apply Country and Company only
    await user.type(screen.getByLabelText('Country'), 'NZ')
    await user.type(screen.getByLabelText('Company'), '550e8400-e29b-41d4-a716-446655440000')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.getByText(/Filters \(2\)/)).toBeInTheDocument()

    // After Reset, 0 applied
    const resetButtons = screen.getAllByRole('button', { name: 'Reset Filters' })
    await user.click(resetButtons[0])
    expect(screen.getByText(/Filters \(0\)/)).toBeInTheDocument()
  })
})
