import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import NewLocationPage from '@/app/(app)/locations/new/page';
import { createLocation, getActiveCompanies } from './locations-api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('./locations-api', () => ({
  createLocation: jest.fn(),
  getActiveCompanies: jest.fn(),
}));

const push = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  jest.mocked(useRouter).mockReturnValue({ push } as never);
  jest.mocked(getActiveCompanies).mockResolvedValue([]);
  jest.mocked(createLocation).mockResolvedValue({} as never);
});

test('[AC-4] successful save navigates to Locations and displays the creation confirmation', async () => {
  const user = userEvent.setup();
  render(<NewLocationPage />);

  const name = await screen.findByRole('textbox', { name: /Location name/ });
  await user.type(name, 'Northstar Distribution Center');
  await user.click(screen.getByRole('button', { name: 'Save Location' }));

  await waitFor(() => expect(createLocation).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Northstar Distribution Center',
    status: 'ACTIVE',
    companyId: null,
  })));
  expect(await screen.findByRole('status')).toHaveTextContent('Location created successfully.');
  expect(push).toHaveBeenCalledWith('/locations');
  expect(window.sessionStorage.getItem('location-toast')).toBe('Location created successfully.');
});
