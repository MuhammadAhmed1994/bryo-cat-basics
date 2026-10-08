import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NewLocationPage from '@/app/(app)/locations/new/page';
import { createLocation, listActiveCompanies } from './locations-api';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('./locations-api', () => ({
  createLocation: jest.fn(),
  listActiveCompanies: jest.fn(),
}));

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);
  jest.mocked(listActiveCompanies).mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    perPage: 100,
    totalPages: 0,
  });
  jest.mocked(createLocation).mockResolvedValue({} as Awaited<ReturnType<typeof createLocation>>);
});

afterEach(() => {
  jest.useRealTimers();
});

it('[AC-4] successful save navigates to Locations and displays the creation confirmation', async () => {
  render(<NewLocationPage />);
  const name = screen.getByLabelText(/Location name/);
  fireEvent.change(name, { target: { value: 'Toronto Distribution Centre' } });

  await act(async () => {
    fireEvent.submit(screen.getByRole('form', { name: 'Location form' }));
    await Promise.resolve();
  });

  expect(createLocation).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Toronto Distribution Centre', status: 'ACTIVE', companyId: null }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Location created successfully.');

  act(() => {
    jest.advanceTimersByTime(1200);
  });
  expect(mockPush).toHaveBeenCalledWith('/locations');
});
