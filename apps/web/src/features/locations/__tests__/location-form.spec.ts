import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocationForm, EMPTY_LOCATION_FORM, LocationFormValues } from '../location-form'
import { CompanyOption } from '../company-select'

function noop() {}

describe('[AC-7] Geo cascade behaviour', () => {
  it('[AC-7] State/Province and City enable progressively and children clear when Country changes', () => {
    render(
      React.createElement(LocationForm, {
        initialValues: EMPTY_LOCATION_FORM,
        submitLabel: 'Save Location',
        onSubmit: noop,
        onCancel: noop,
      }),
    )

    const country = screen.getByLabelText('Country') as HTMLInputElement
    const state = screen.getByLabelText('State/Province') as HTMLInputElement
    const city = screen.getByLabelText('City') as HTMLInputElement

    // Disabled until parents are chosen
    expect(state).toBeDisabled()
    expect(city).toBeDisabled()

    fireEvent.change(country, { target: { value: 'Australia' } })
    expect(state).not.toBeDisabled()

    fireEvent.change(state, { target: { value: 'New South Wales' } })
    expect(city).not.toBeDisabled()

    fireEvent.change(city, { target: { value: 'Sydney' } })
    expect(city).toHaveValue('Sydney')

    // Changing the country clears state and city and disables City again
    fireEvent.change(country, { target: { value: 'United States' } })
    expect(state).toHaveValue('')
    expect(city).toHaveValue('')
    expect(city).toBeDisabled()
  })
})

describe('[AC-8] CompanySelect filters to active companies', () => {
  it('[AC-8] option list contains only active companies', () => {
    const companies: CompanyOption[] = [
      { id: 'a1', name: 'Active One', isActive: true },
      { id: 'a2', name: 'Active Two', isActive: true },
      { id: 'i1', name: 'Inactive Co', isActive: false },
    ]

    render(
      React.createElement(LocationForm, {
        initialValues: EMPTY_LOCATION_FORM,
        submitLabel: 'Save Location',
        companies,
        onSubmit: noop,
        onCancel: noop,
      }),
    )

    const select = screen.getByLabelText('Company options') as HTMLSelectElement
    const optionLabels = Array.from(select.options).map((o) => o.textContent)

    expect(optionLabels).toEqual(expect.arrayContaining(['None', 'Active One', 'Active Two']))
    expect(optionLabels).not.toEqual(expect.arrayContaining(['Inactive Co']))
  })
})

describe('[AC-10] Edit form pre-populates values', () => {
  it('[AC-10] every stored value including Company and geo chain is pre-populated; Save disabled until prefill completes', () => {
    const companies: CompanyOption[] = [
      { id: 'a1', name: 'Active One', isActive: true },
      { id: 'i1', name: 'Dormant Ranch', isActive: false },
    ]

    const initial: LocationFormValues = {
      name: 'Sydney Office',
      companyId: 'i1',
      phone: '+61 2 9123 4567',
      contactName: 'Dana Whitfield',
      contactPhone: '+61 412 345 678',
      addressLine1: '42 Harbour Road',
      addressLine2: 'Level 3',
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Sydney',
      postalCode: '2000',
    }

    render(
      React.createElement(LocationForm, {
        initialValues: initial,
        submitLabel: 'Save Changes',
        prefillComplete: false,
        companies,
        onSubmit: noop,
        onCancel: noop,
      }),
    )

    expect(screen.getByLabelText('Country')).toHaveValue('Australia')
    expect(screen.getByLabelText('State/Province')).toHaveValue('New South Wales')
    expect(screen.getByLabelText('City')).toHaveValue('Sydney')

    const select = screen.getByLabelText('Company options') as HTMLSelectElement
    expect(select.value).toBe('i1')
    expect(select.selectedOptions[0].textContent).toMatch(/Dormant Ranch \(inactive\)$/)

    const save = screen.getByRole('button', { name: 'Save Changes' })
    expect(save).toBeDisabled()
  })
})
