import { render, screen, waitFor } from '@testing-library/react';
import { LocationDetail } from './location-detail';
import { getLocation } from './location-api';

jest.mock('./location-api', () => ({
  getLocation: jest.fn(),
}));

const mockGetLocation = getLocation as jest.MockedFunction<typeof getLocation>;

describe('LocationDetail', () => {
  it('[AC-7] shows updated details and the edit entry point after a successful edit', async () => {
    mockGetLocation.mockResolvedValue({
      id: 'loc-123',
      name: 'Northfield Distribution',
      companyId: 'company-1',
      company: { id: 'company-1', name: 'Acme Group' },
      phone: '(510) 555-0184',
      contactPerson: 'Jordan Lee',
      contactPersonPhone: '(510) 555-0123',
      addressLine1: '2400 Harbor Bay Parkway',
      addressLine2: null,
      country: 'United States',
      stateProvince: 'California',
      city: 'Oakland',
      postalCode: '94621',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });

    render(<LocationDetail id="loc-123" showSuccess />);

    expect(await screen.findByText('Northfield Distribution')).toBeInTheDocument();
    expect(screen.getByText('Acme Group')).toBeInTheDocument();
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('(510) 555-0184')).toBeInTheDocument();
    expect(screen.getByText('(510) 555-0123')).toBeInTheDocument();
    expect(screen.getByText('2400 Harbor Bay Parkway')).toBeInTheDocument();
    expect(screen.getByText('Oakland')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('94621')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Location updated successfully.');
    expect(screen.getByRole('link', { name: 'Edit Location' })).toHaveAttribute(
      'href',
      '/locations/loc-123/edit',
    );
    expect(screen.getByRole('link', { name: /Back to Locations/ })).toHaveAttribute('href', '/locations');
    expect(screen.queryByRole('button', { name: /status/i })).not.toBeInTheDocument();
    await waitFor(() => expect(mockGetLocation).toHaveBeenCalledWith('loc-123'));
  });
});
