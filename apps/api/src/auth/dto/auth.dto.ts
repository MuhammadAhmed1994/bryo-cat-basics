import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const trim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value,
);

/** Spec 2.1.7 — minimum 8 characters, surfaced before submit on the client too. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULE_MESSAGE = 'Password must contain at least 8 characters.';

export class LoginDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString({ message: 'Enter your password.' })
  @MinLength(1, { message: 'Enter your password.' })
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString({ message: 'Enter new password' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_RULE_MESSAGE })
  password!: string;
}

export class CompleteSignupDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(1, { message: 'Enter first name' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters.' })
  @trim
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Enter last name' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @trim
  lastName!: string;

  @IsString({ message: 'Enter password' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_RULE_MESSAGE })
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Enter your current password.' })
  currentPassword!: string;

  @IsString({ message: 'Enter new password' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_RULE_MESSAGE })
  newPassword!: string;
}
