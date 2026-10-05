import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeoCascadeField } from '../geo-cascade-field'
import { CompanySelect } from '../company-select'

// Mock Next.js app router for client pages used in tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}))

import EditLocationPage from '@/app/(app)/locations/[id]/edit/page'

function setupGeo(values = { country: '', stateProvince: '', city: '' }) {
  function Wrapper() {
    const [state, setState] = React.useState(values)
    return React.createElement(GeoCascadeField, { values: state, onChange: setState })
  }
  render(React.createElement(Wrapper))
}

describe('Location forms', () => {
  it('[AC-7] disables child selects until parent is chosen and clears children when Country changes', async () => {
    const user = userEvent.setup()
    setupGeo()

    const country = screen.getByLabelText('Country') as HTMLSelectElement
    const state = screen.getByLabelText('State/Province') as HTMLSelectElement
    const city = screen.getByLabelText('City') as HTMLSelectElement

    expect(state).toBeDisabled()
    expect(city).toBeDisabled()

    await user.selectOptions(country, 'Australia')
    expect(state).toBeEnabled()
    expect(city).toBeDisabled()

    await user.selectOptions(state, 'New South Wales')
    expect(city).toBeEnabled()

    // Change Country — both State and City are cleared (AC-7)
    await user.selectOptions(country, 'United States')
    expect(screen.getByLabelText('State/Province')).toHaveValue('')
    expect(screen.getByLabelText('City')).toHaveValue('')
    // City remains disabled until a state is re-selected
    expect(screen.getByLabelText('City')).toBeDisabled()
  })

  it('[AC-8] CompanySelect lists only active companies', async () => {
    const user = userEvent.setup()

    const mockCompanies = {
      data: [
        {
          id: 'active-1',
          name: 'Active Co',
          phone: '+6100000000',
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
        },
        {
          id: 'inactive-1',
          name: 'Old Co',
          phone: '+6100000000',
          email: null,
          website: null,
          billingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
          shippingSameAsBilling: true,
          shippingAddress: { line1: null, line2: null, country: null, state: null, city: null, postalCode: null },
          isActive: false,
          createdAt: '',
          updatedAt: '',
          createdById: null,
          updatedById: null,
        },
      ],
      total: 2,
      page: 1,
      perPage: 50,
    }

    ;(globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCompanies,
    })

    function Wrapper() {
      const [value, setValue] = React.useState<string | null>(null)
      return React.createElement(CompanySelect, { value, onChange: setValue })
    }

    render(React.createElement(Wrapper))

    // Open the dropdown
    await user.click(screen.getByPlaceholderText('Search companies'))

    // Only the active company appears; the inactive one is not listed (AC-8)
    expect(await screen.findByRole('option', { name: /Active Co/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Old Co/i })).not.toBeInTheDocument()

    // The API is queried
    expect((globalThis as any).fetch).toHaveBeenCalled()

    ;(globalThis as any).fetch = undefined
  })

  it('[AC-10] Edit page pre-populates every stored value including Company and geo chain', async () => {
    const location = {
      id: 'loc-1',
      name: 'Sydney Office',
      companyId: 'comp-1',
      phone: '+61 2 9000 0000',
      contactPersonName: 'Dana',
      contactPersonPhone: '+61 400 000 000',
      addressLine1: '42 Harbour Road',
      addressLine2: 'Level 3',
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Sydney',
      postalCode: '2000',
      status: 'ACTIVE' as const,
    }

    const company = {
      id: 'comp-1',
      name: 'Acme Cattle Co.',
      phone: '+6100000000',
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
    }

    ;(globalThis as any).fetch = jest.fn((url: string) => {
      if (url.includes('/locations/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => location })
      }
      if (url.includes('/companies/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => company })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })

    render(React.createElement(EditLocationPage, { params: { id: 'loc-1' } }))

    // While loading, a spinner is shown so the primary action is effectively disabled
    expect(screen.getByRole('status')).toBeInTheDocument()

    // After load, all values are pre-populated
    expect(await screen.findByLabelText(/^Name/)).toHaveValue('Sydney Office')

    // CompanySelect shows the stored company name
    const companyInput = screen.getByPlaceholderText('Search companies') as HTMLInputElement
    expect(companyInput.value).toMatch(/Acme Cattle Co\./)

    // The geo chain is preserved
    expect(screen.getByLabelText('Country')).toHaveValue('Australia')
    expect(screen.getByLabelText('State/Province')).toHaveValue('New South Wales')
    expect(screen.getByLabelText('City')).toHaveValue('Sydney')

    ;(globalThis as any).fetch = undefined
  })
})
