import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsList } from './locations-list';
import { listLocations, Location } from './location-api';

jest.mock('./location-api', () => ({
  ...jest.requireActual('./location-api'),
  listLocations: jest.fn(),
}));

const mockedList = jest.mocked(listLocations);
const loc = (id: string, name: string, status: 'ACTIVE' | 'INACTIVE', company: Location['company'] = null, country = 'Canada'): Location => ({
  id, name, status, company, companyId: company?.id ?? null, country,
  phone: null, contactPerson: null, contactPersonPhone: null, addressLine1: null,
  addressLine2: null, stateProvince: null, city: null, postalCode: null,
  createdAt: '', updatedAt: '',
});
const sample = [
  loc('1', 'Albany Distribution Center', 'ACTIVE', { id: 'co-1', name: 'Acme Group' }),
  loc('2', 'Bristol Service Hub', 'ACTIVE'),
  loc('3', 'Cedar Depot', 'INACTIVE', { id: 'co-2', name: 'Northstar' }, 'United States'),
];
function page(data: Location[], total = data.length) {
  return { data, total, page: 1, perPage: 50 };
}

beforeEach(() => {
  mockedList.mockReset();
  mockedList.mockImplementation(async (query = {}) => {
    if (query.status === 'ALL') return { ...page(sample), perPage: 100 };
    if (query.search) {
      const matching = sample.filter((location) => location.name.toLowerCase().includes(query.search!.toLowerCase()));
      return page(matching);
    }
    if (query.status === 'INACTIVE') return page([sample[2]]);
    return page(sample.slice(0, 2));
  });
});

describe('Locations list', () => {
  it('[AC-8] initially requests 50 active locations sorted by name and displays company and readable status', async () => {
    render(<LocationsList />);
    expect(await screen.findByText('Albany Distribution Center')).toBeInTheDocument();
    expect(screen.getByText('Bristol Service Hub')).toBeInTheDocument();
    expect(screen.getAllByText('Acme Group')).toHaveLength(2);
    expect(screen.getByLabelText('No Company')).toHaveTextContent('-');
    expect(screen.getAllByTitle('Active')).toHaveLength(2);
    expect(within(screen.getByRole('row', { name: /Albany Distribution Center/ })).getByText('Active')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /Bristol Service Hub/ })).getByText('Active')).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACTIVE', sortDir: 'ASC', perPage: 50, page: 1 }));
    expect(screen.getByLabelText('Rows per page')).toHaveValue('50');
  });

  it('[AC-9] trims search and matches names case-insensitively and partially, showing the empty result message when unmatched', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByText('Albany Distribution Center');
    const searchBox = screen.getByRole('searchbox', { name: 'Search locations' });
    await user.type(searchBox, '  bRiSt  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Bristol Service Hub')).toBeInTheDocument();
    expect(mockedList).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'bRiSt', status: 'ACTIVE' }));
    await user.clear(searchBox);
    await user.type(searchBox, '  zEnItH  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('heading', { name: 'No locations found.' })).toBeInTheDocument();
    expect(mockedList).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'zEnItH', status: 'ACTIVE' }));
  });

  it('[AC-10] applies status, Country and Company draft filters and Reset Filters restores Active defaults', async () => {
    const user = userEvent.setup();
    render(<LocationsList />);
    await screen.findByText('Albany Distribution Center');
    await screen.findByRole('option', { name: 'Northstar' });
    await user.selectOptions(screen.getByLabelText('Status'), 'INACTIVE');
    await user.selectOptions(screen.getByLabelText('Country'), 'United States');
    await user.selectOptions(screen.getByLabelText('Company'), 'co-2');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(mockedList).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'INACTIVE', country: 'United States', companyId: 'co-2' })));
    expect(screen.getByText('3 applied filters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset Filters' }));
    await waitFor(() => expect(mockedList).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ACTIVE', sortDir: 'ASC', perPage: 50, page: 1 })));
    expect(screen.getByText('1 applied filter')).toBeInTheDocument();
  });
});
