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
  ValidateIf,
} from 'class-validator';
import { LocationStatus } from '../entities/location.entity';

const trimNullable = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class UpdateLocationDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(1, { message: 'Enter a location name' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional() @IsString() @trimNullable
  description?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @IsOptional() @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @trimNullable
  phone?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimNullable
  contactPersonName?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @trimNullable
  contactPersonPhone?: string | null;

  @IsOptional() @IsEmail() @MaxLength(255) @trimNullable
  contactPersonEmail?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @trimNullable
  addressLine1?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @trimNullable
  addressLine2?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimNullable
  country?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimNullable
  stateProvince?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimNullable
  city?: string | null;

  @IsOptional() @IsString() @MaxLength(20) @trimNullable
  postalCode?: string | null;
}
