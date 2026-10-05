import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

const trim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value,
);
const trimOrNull = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? (value.trim() || null) : value,
);

/** Validation and messages mirror Companies where applicable. */
export class CreateLocationDto {
  @IsString()
  @MinLength(1, { message: 'Enter a location name' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @trim
  name!: string;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @trimOrNull
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimOrNull
  contactPersonName?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @trimOrNull
  contactPersonPhone?: string | null;

  @IsOptional() @IsString() @MaxLength(255) @trimOrNull addressLine1?: string | null;
  @IsOptional() @IsString() @MaxLength(255) @trimOrNull addressLine2?: string | null;
  @IsOptional() @IsString() @MaxLength(100) @trimOrNull country?: string | null;
  @IsOptional() @IsString() @MaxLength(100) @trimOrNull stateProvince?: string | null;
  @IsOptional() @IsString() @MaxLength(100) @trimOrNull city?: string | null;
  @IsOptional() @IsString() @MaxLength(20) @trimOrNull postalCode?: string | null;
}
