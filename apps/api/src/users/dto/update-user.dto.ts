import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

/** Spec 2.5.3 — only names and roles are editable; email is immutable. */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name is required.' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name is required.' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsOptional()
  @IsArray({ message: 'Select a role.' })
  @ArrayNotEmpty({ message: 'Select a role.' })
  @IsEnum(UserRole, { each: true, message: 'Select a role.' })
  roles?: UserRole[];
}
