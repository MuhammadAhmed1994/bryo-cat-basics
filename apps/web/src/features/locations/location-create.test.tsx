import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewLocationPage from '@/app/(app)/locations/new/page';
import { createLocation, getActiveCompanies } from './locations-api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('./locations-api', () => ({
  createLocation: jest.fn(),
  getActiveCompanies: jest.fn(),
}));

const mockCreateLocation = createLocation as jest.MockedFunction<typeof createLocation>;
const mockGetActiveCompanies = getActiveCompanies as jest.MockedFunction<typeof getActiveCompanies>;

describe('Add Location route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveCompanies.mockResolvedValue([]);
    mockCreateLocation.mockResolvedValue({} as Awaited<ReturnType<typeof createLocation>>);
    window.sessionStorage.clear();
  });

  it('[AC-4] successful save navigates to the Location list and displays the creation confirmation', async () => {
    const user = userEvent.setup();
    render(<NewLocationPage />);

    await user.type(screen.getByLabelText(/Location name/), 'Toronto Distribution Centre');
    await user.click(screen.getByRole('button', { name: 'Save Location' }));

    await waitFor(() => expect(mockCreateLocation).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Toronto Distribution Centre',
      companyId: null,
    })));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/locations?created=1'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent('Location created successfully.');
    expect(window.sessionStorage.getItem('nbryo.locations.created')).toBe('true');
  });
});
