/**
 * Client-side validation. Every message here is quoted verbatim from the
 * functional spec so the UI and the API agree on wording. Spec 2.1.7 also
 * requires the password rule to be visible *before* submitting, which is why
 * these are pure functions the forms can call as the user types.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULE = 'Password must contain at least 8 characters.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Spec 2.1.1.1 — email is trimmed and case-insensitive. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Spec 2.1.1.4 */
export function validateLoginEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Enter your email address.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address';
  return null;
}

/** Spec 2.1.1.4 */
export function validateLoginPassword(value: string): string | null {
  if (!value) return 'Enter your password.';
  return null;
}

/** Spec 2.1.7 */
export function validateNewPassword(value: string, label = 'password'): string | null {
  if (!value) return label === 'password' ? 'Enter password' : 'Enter new password';
  if (value.length < PASSWORD_MIN_LENGTH) return PASSWORD_RULE;
  return null;
}

/** Spec 2.1.6.1 / 2.3.2 */
export function validateConfirmPassword(
  password: string,
  confirm: string,
  label = 'Confirm password',
): string | null {
  if (!confirm) return label;
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

/** Spec 2.5.1 */
export function validateFirstName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'First name is required.';
  if (name.length > 50) return 'First name cannot exceed 50 characters.';
  return null;
}

/** Spec 2.5.1 */
export function validateLastName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Last name is required.';
  if (name.length > 50) return 'Last name cannot exceed 50 characters.';
  return null;
}

/** Spec 2.8.1 */
export function validateCompanyName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Enter a company name';
  if (name.length > 100) return 'Name cannot exceed 100 characters.';
  return null;
}

/** Spec 2.8.1 — phone is required for a company. */
export function validateCompanyPhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return 'Enter a phone number';
  if (!/^\+?[0-9\s()-]{6,}$/.test(phone)) return 'Enter a valid phone number.';
  return null;
}

/** Spec 2.8.1 — email is optional, but must be valid when given. */
export function validateOptionalEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
}

/** Spec 2.8.1 — website is optional. */
export function validateOptionalWebsite(value: string): string | null {
  const url = value.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'Enter a valid URL.';
    return null;
  } catch {
    return 'Enter a valid URL.';
  }
}

/** True when no field in the map has an error. */
export function isClean(errors: Record<string, string | null>): boolean {
  return Object.values(errors).every((error) => !error);
}
