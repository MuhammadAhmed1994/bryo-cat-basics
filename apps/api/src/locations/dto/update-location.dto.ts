import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trimValue = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class UpdateLocationDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'Enter a location name.' })
  @MinLength(1, { message: 'Enter a location name.' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  companyId?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @trimValue
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @trimValue
  contactPerson?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @trimValue
  contactPersonPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @trimValue
  addressLine1?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @trimValue
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimValue
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimValue
  stateProvince?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimValue
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @trimValue
  postalCode?: string | null;
}
