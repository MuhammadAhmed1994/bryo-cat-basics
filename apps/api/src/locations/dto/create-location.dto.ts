import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimText = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

export class CreateLocationDto {
  @IsString()
  @MinLength(1, { message: 'Enter a location name.' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9\s()-]+$/, { message: 'Enter a valid phone number.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  phone?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimText
  contactPerson?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9\s()-]+$/, { message: 'Enter a valid phone number.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  contactPersonPhone?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @trimText
  addressLine1?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @trimText
  addressLine2?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimText
  country?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimText
  stateProvince?: string | null;

  @IsOptional() @IsString() @MaxLength(100) @trimText
  city?: string | null;

  @IsOptional() @IsString() @MaxLength(20) @trimText
  postalCode?: string | null;
}
