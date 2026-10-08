import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimNullableString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Enter a location name.' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(trimString)
  name?: string;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @Transform(trimNullableString)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimNullableString)
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimNullableString)
  stateProvince?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimNullableString)
  city?: string | null;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}
