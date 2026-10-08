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

it('[AC-4] successful save returns to Locations with a creation confirmation', async () => {
  const user = userEvent.setup();
  const push = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ push } as never);
  jest.mocked(getActiveCompanies).mockResolvedValue([]);
  jest.mocked(createLocation).mockResolvedValue({} as never);

  render(<NewLocationPage />);

  await user.type(await screen.findByLabelText(/^Location name/), 'Northstar Toronto');
  await user.click(screen.getByRole('button', { name: 'Save Location' }));

  await waitFor(() => expect(push).toHaveBeenCalledWith('/locations'));
  expect(createLocation).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Northstar Toronto',
    companyId: null,
  }));
  expect(await screen.findByRole('status')).toHaveTextContent('Location created successfully.');
});
