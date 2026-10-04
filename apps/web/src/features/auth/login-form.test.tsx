import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';
import { AuthProvider } from './auth-context';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/api';

const replace = jest.fn();
const searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
  useSearchParams: () => searchParams,
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, apiFetch: jest.fn() };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SESSION = {
  accessToken: 'jwt-token',
  user: {
    id: 'user-uuid',
    email: 'john.smith@example.com',
    firstName: 'John',
    lastName: 'Smith',
    roles: ['ADMIN'],
    status: 'ACTIVE',
  },
};

function renderLogin() {
  render(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>,
  );
}

describe('LoginForm (spec 2.1.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockApiFetch.mockReset();
  });

  it('shows both empty-field messages and does not call the API', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('rejects a malformed email such as john@ (spec 2.1.1.4)', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/Email/), 'john@');
    await user.type(screen.getByLabelText(/Password/), 'Sup3rSecret!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('sends a trimmed, lower-cased email and redirects to the dashboard', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValue(SESSION as never);
    renderLogin();

    await user.type(screen.getByLabelText(/Email/), '  John.Smith@Example.COM  ');
    await user.type(screen.getByLabelText(/Password/), 'Sup3rSecret!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: { email: 'john.smith@example.com', password: 'Sup3rSecret!' },
        anonymous: true,
      }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('stores the token and remembers the email (spec 2.1.8)', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValue(SESSION as never);
    renderLogin();

    await user.type(screen.getByLabelText(/Email/), 'john.smith@example.com');
    await user.type(screen.getByLabelText(/Password/), 'Sup3rSecret!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(window.localStorage.getItem('nbryo.accessToken')).toBe('jwt-token'),
    );
    expect(window.localStorage.getItem('nbryo.lastEmail')).toBe('john.smith@example.com');
  });

  it('prefills the remembered email on a return visit (spec 2.1.8)', async () => {
    window.localStorage.setItem('nbryo.lastEmail', 'farmer@example.com');
    renderLogin();

    await waitFor(() =>
      expect(screen.getByLabelText(/Email/)).toHaveValue('farmer@example.com'),
    );
  });

  it('surfaces the server message for bad credentials (spec 2.1.1.4)', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockRejectedValue(
      new ApiError(401, 'Email or password is incorrect. Please try again.'),
    );
    renderLogin();

    await user.type(screen.getByLabelText(/Email/), 'john.smith@example.com');
    await user.type(screen.getByLabelText(/Password/), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(
      await screen.findByText('Email or password is incorrect. Please try again.'),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('surfaces the inactive-account message (spec 2.1.1.5)', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockRejectedValue(
      new ApiError(403, 'Your account is currently inactive. Please contact your administrator.'),
    );
    renderLogin();

    await user.type(screen.getByLabelText(/Email/), 'john.smith@example.com');
    await user.type(screen.getByLabelText(/Password/), 'Sup3rSecret!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(
      await screen.findByText(
        'Your account is currently inactive. Please contact your administrator.',
      ),
    ).toBeInTheDocument();
  });

  it('submits when Enter is pressed in the password field (spec 2.1.1.3)', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValue(SESSION as never);
    renderLogin();

    await user.type(screen.getByLabelText(/Email/), 'john.smith@example.com');
    await user.type(screen.getByLabelText(/Password/), 'Sup3rSecret!{Enter}');

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  });

  it('masks the password until the reveal button is used (spec 2.1.1.2)', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText(/Password/);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'password');
  });
});
