import {
  isClean,
  normalizeEmail,
  validateCompanyName,
  validateCompanyPhone,
  validateConfirmPassword,
  validateFirstName,
  validateLastName,
  validateLoginEmail,
  validateLoginPassword,
  validateNewPassword,
  validateOptionalEmail,
  validateOptionalWebsite,
} from './validation';

describe('normalizeEmail', () => {
  it('trims and lower-cases (spec 2.1.1.1)', () => {
    expect(normalizeEmail('  John.Smith@Example.COM ')).toBe('john.smith@example.com');
  });
});

describe('login validation (spec 2.1.1.4)', () => {
  it('requires an email address', () => {
    expect(validateLoginEmail('')).toBe('Enter your email address.');
    expect(validateLoginEmail('   ')).toBe('Enter your email address.');
  });

  it('rejects a malformed email such as john@', () => {
    expect(validateLoginEmail('john@')).toBe('Enter a valid email address');
  });

  it('accepts a valid email with surrounding spaces', () => {
    expect(validateLoginEmail('  name@example.com  ')).toBeNull();
  });

  it('requires a password', () => {
    expect(validateLoginPassword('')).toBe('Enter your password.');
    expect(validateLoginPassword('anything')).toBeNull();
  });
});

describe('password rules (spec 2.1.7)', () => {
  it('requires at least 8 characters', () => {
    expect(validateNewPassword('short')).toBe('Password must contain at least 8 characters.');
    expect(validateNewPassword('longenough')).toBeNull();
  });

  it('reports an empty new password with the reset wording', () => {
    expect(validateNewPassword('', 'new password')).toBe('Enter new password');
  });

  it('reports an empty password with the signup wording', () => {
    expect(validateNewPassword('')).toBe('Enter password');
  });

  it('requires the confirmation to match', () => {
    expect(validateConfirmPassword('longenough', 'different')).toBe('Passwords do not match.');
    expect(validateConfirmPassword('longenough', 'longenough')).toBeNull();
  });

  it('reports a missing confirmation with the given label', () => {
    expect(validateConfirmPassword('longenough', '', 'Confirm new password')).toBe(
      'Confirm new password',
    );
  });
});

describe('name validation (spec 2.5.1)', () => {
  it('requires a first name', () => {
    expect(validateFirstName('  ')).toBe('First name is required.');
  });

  it('caps the first name at 50 characters', () => {
    expect(validateFirstName('a'.repeat(51))).toBe('First name cannot exceed 50 characters.');
    expect(validateFirstName('a'.repeat(50))).toBeNull();
  });

  it('requires a last name', () => {
    expect(validateLastName('')).toBe('Last name is required.');
  });

  it('caps the last name at 50 characters', () => {
    expect(validateLastName('b'.repeat(51))).toBe('Last name cannot exceed 50 characters.');
  });
});

describe('company validation (spec 2.8.1)', () => {
  it('requires a name', () => {
    expect(validateCompanyName(' ')).toBe('Enter a company name');
  });

  it('caps the name at 100 characters', () => {
    expect(validateCompanyName('c'.repeat(101))).toBe('Name cannot exceed 100 characters.');
    expect(validateCompanyName('c'.repeat(100))).toBeNull();
  });

  it('requires a phone number and checks its shape', () => {
    expect(validateCompanyPhone('')).toBe('Enter a phone number');
    expect(validateCompanyPhone('call me')).toBe('Enter a valid phone number.');
    expect(validateCompanyPhone('+61 400 000 000')).toBeNull();
  });

  it('treats email as optional but validates it when present', () => {
    expect(validateOptionalEmail('')).toBeNull();
    expect(validateOptionalEmail('nope@')).toBe('Enter a valid email address.');
    expect(validateOptionalEmail('hi@acme.test')).toBeNull();
  });

  it('treats website as optional but requires a real URL when present', () => {
    expect(validateOptionalWebsite('')).toBeNull();
    expect(validateOptionalWebsite('acme')).toBe('Enter a valid URL.');
    expect(validateOptionalWebsite('ftp://acme.test')).toBe('Enter a valid URL.');
    expect(validateOptionalWebsite('https://acme.test')).toBeNull();
  });
});

describe('isClean', () => {
  it('is true only when every field is error-free', () => {
    expect(isClean({ name: null, phone: null })).toBe(true);
    expect(isClean({ name: null, phone: 'Enter a phone number' })).toBe(false);
  });
});
