const TOKEN_KEY = 'nbryo.accessToken';
const USER_KEY = 'nbryo.user';
const REMEMBERED_EMAIL_KEY = 'nbryo.lastEmail';

/** Guards every access so these helpers are safe during server rendering. */
function store(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function getToken(): string | null {
  return store()?.getItem(TOKEN_KEY) ?? null;
}

export function setSession(token: string, user: unknown): void {
  const s = store();
  if (!s) return;
  s.setItem(TOKEN_KEY, token);
  s.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  const raw = store()?.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  const s = store();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
}

/**
 * Spec 2.1.8 — remember the last email used on this device so frequent users
 * do not retype it. Deliberately survives logout; the session does not.
 */
export function rememberEmail(email: string): void {
  store()?.setItem(REMEMBERED_EMAIL_KEY, email);
}

export function getRememberedEmail(): string {
  return store()?.getItem(REMEMBERED_EMAIL_KEY) ?? '';
}
