import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

/** Spec 2.5.1 — validation messages are quoted verbatim from the spec. */
export class InviteUserDto {
  @IsString()
  @MinLength(1, { message: 'First name is required.' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Last name is required.' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @IsEmail({}, { message: 'Enter a valid email address.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsArray({ message: 'Select a role.' })
  @ArrayNotEmpty({ message: 'Select a role.' })
  @IsEnum(UserRole, { each: true, message: 'Select a role.' })
  roles!: UserRole[];
}
