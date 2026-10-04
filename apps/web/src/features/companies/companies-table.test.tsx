import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompaniesTable } from './companies-table';
import { Company } from '@/lib/types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function makeCompany(overrides: Partial<Company> = {}): Company {
  const emptyAddress = {
    line1: null,
    line2: null,
    country: null,
    state: null,
    city: null,
    postalCode: null,
  };
  return {
    id: 'company-uuid',
    name: 'Acme Genetics',
    phone: '+61400000000',
    email: null,
    website: null,
    billingAddress: emptyAddress,
    shippingSameAsBilling: true,
    shippingAddress: emptyAddress,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdById: null,
    updatedById: null,
    ...overrides,
  };
}

describe('CompaniesTable (spec 2.8.7)', () => {
  it('shows Name, Phone and Status columns', () => {
    render(
      <CompaniesTable
        companies={[makeCompany()]}
        sortDir="ASC"
        onToggleSort={jest.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Phone Number' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });

  it('links each company name to its details screen', () => {
    render(
      <CompaniesTable companies={[makeCompany()]} sortDir="ASC" onToggleSort={jest.fn()} />,
    );

    expect(screen.getByRole('link', { name: 'Acme Genetics' })).toHaveAttribute(
      'href',
      '/companies/company-uuid',
    );
  });

  it('marks active and inactive companies with a status indicator', () => {
    render(
      <CompaniesTable
        companies={[
          makeCompany({ id: 'a', name: 'Active Co', isActive: true }),
          makeCompany({ id: 'b', name: 'Dormant Co', isActive: false }),
        ]}
        sortDir="ASC"
        onToggleSort={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('exposes the full value as a tooltip so truncated text stays readable (spec 2.2.5)', () => {
    const longName = 'A very long company name that will not fit in the column';
    render(
      <CompaniesTable
        companies={[makeCompany({ name: longName })]}
        sortDir="ASC"
        onToggleSort={jest.fn()}
      />,
    );

    expect(screen.getByTitle(longName)).toBeInTheDocument();
  });

  it('reports the current sort direction and toggles it on click', async () => {
    const user = userEvent.setup();
    const onToggleSort = jest.fn();
    render(
      <CompaniesTable
        companies={[makeCompany()]}
        sortDir="DESC"
        onToggleSort={onToggleSort}
      />,
    );

    expect(screen.getByText('sorted descending')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Name/ }));
    expect(onToggleSort).toHaveBeenCalledTimes(1);
  });
});
