import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page, { LocationListItem } from '@/app/(app)/locations/page';
import { LocationsTable } from '@/features/locations/locations-table';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

function makeItems(): LocationListItem[] {
  return [
    { id: '1', name: 'Sydney Office', company: 'Acme', country: 'Australia', status: 'ACTIVE' },
    { id: '2', name: 'Perth Depot', company: 'Acme', country: 'Australia', status: 'INACTIVE' },
    { id: '3', name: 'Chicago Lab', company: 'Globex', country: 'USA', status: 'INACTIVE' },
  ];
}

describe('Locations List', () => {
  it('[AC-6]', () => {
    render(React.createElement(Page, { searchParams: { added: '1' }, items: [] }));
    expect(screen.getByText('Location added successfully')).toBeInTheDocument();
  });

  it('[AC-15]', () => {
    render(
      React.createElement(LocationsTable, {
        locations: [
          { id: '1', name: 'Sydney Office', company: 'Acme', status: 'ACTIVE' },
          { id: '2', name: 'No Company', company: null, status: 'INACTIVE' },
        ],
      }),
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Sydney Office' })).toHaveAttribute(
      'href',
      '/locations/1',
    );

    // Company column shows '-' when no company
    expect(screen.getByText('-')).toBeInTheDocument();

    // StatusDot + text labels
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('[AC-18]', async () => {
    const user = userEvent.setup();
    render(React.createElement(Page, { items: makeItems() }));

    // Search for a term that does not exist
    const input = screen.getByPlaceholderText('Search');
    await user.type(input, 'zzz{enter}');

    expect(screen.getByText('No locations found.')).toBeInTheDocument();
  });

  it('[AC-20]', async () => {
    const user = userEvent.setup();
    render(React.createElement(Page, { items: makeItems() }));

    // Select Inactive status + Australia + Acme then apply
    await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE');
    await user.type(screen.getByLabelText('Country'), 'Australia');
    await user.type(screen.getByLabelText('Company'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    // Only Perth Depot matches all three filters
    expect(screen.getByRole('link', { name: 'Perth Depot' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sydney Office' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Chicago Lab' })).not.toBeInTheDocument();
  });

  it('[AC-21]', async () => {
    const user = userEvent.setup();
    render(React.createElement(Page, { items: makeItems() }));

    // Set a search and filters
    const input = screen.getByPlaceholderText('Search');
    await user.type(input, 'Syd{enter}');
    await user.selectOptions(screen.getByLabelText('Status'), 'ALL');
    await user.type(screen.getByLabelText('Country'), 'Australia');

    // Reset
    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));

    // Search box cleared
    expect(screen.getByPlaceholderText('Search')).toHaveValue('');

    // Default state — Active locations only (Sydney Office shows, Perth Depot hidden)
    expect(screen.getByRole('link', { name: 'Sydney Office' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Perth Depot' })).not.toBeInTheDocument();
  });

  it('[AC-22]', async () => {
    const user = userEvent.setup();
    render(React.createElement(Page, { items: makeItems() }));

    // Two applied filters (Country + Company), search not counted
    await user.type(screen.getByLabelText('Country'), 'Australia');
    await user.type(screen.getByLabelText('Company'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByText('Filters (2)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
    expect(screen.getByText('Filters (0)')).toBeInTheDocument();
  });
});
