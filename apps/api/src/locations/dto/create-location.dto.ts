import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength, IsUUID } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @MinLength(1, { message: 'Enter a location name' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  contactPersonName?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactPersonPhone?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  addressLine1?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  addressLine2?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  country?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  stateProvince?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  city?: string | null;

  @IsOptional() @IsString() @MaxLength(20) @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  postalCode?: string | null;
}
