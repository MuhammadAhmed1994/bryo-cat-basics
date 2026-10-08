import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LocationStatus } from '../entities/location.entity';

const PHONE_PATTERN = /^(?=.*\d)\+?[0-9\s()-]{6,30}$/;

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Enter a location name.' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(PHONE_PATTERN, { message: 'Enter a valid phone number.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPersonName?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(PHONE_PATTERN, { message: 'Enter a valid phone number.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactPersonPhone?: string | null;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address.' })
  contactPersonEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateProvince?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;
}
