'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { AuthUser } from '@/lib/types';
import { clearSession, getStoredUser, getToken, setSession } from '@/lib/storage';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Render immediately from the cached user, then confirm with the server so
    // a revoked session (spec 2.1.2) is caught on the next page load.
    const cached = getStoredUser<AuthUser>();
    if (cached) setUser(cached);

    if (!getToken()) {
      setLoading(false);
      return;
    }

    apiFetch<AuthUser>('/auth/me')
      .then((fresh) => setUser(fresh))
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((token: string, nextUser: AuthUser) => {
    setSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST' });
    } catch {
      // The session is going away locally regardless of what the server says.
    }
    clearSession();
    setUser(null);
    // replace() so the browser Back button cannot return to an authenticated
    // page (spec 2.1.2).
    router.replace('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
