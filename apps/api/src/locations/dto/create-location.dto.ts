import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimNullable = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

/** Request shape for creating a Location; geography values are stored as entered text. */
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
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?(?=(?:\D*\d){7,15}\D*$)[0-9\s().-]+$/, {
    message: 'Enter a valid phone number.',
  })
  @trimNullable
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @trimNullable
  contactPerson?: string | null;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?(?=(?:\D*\d){7,15}\D*$)[0-9\s().-]+$/, {
    message: 'Enter a valid phone number.',
  })
  @trimNullable
  contactPersonPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @trimNullable
  addressLine1?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @trimNullable
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimNullable
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimNullable
  stateProvince?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @trimNullable
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @trimNullable
  postalCode?: string | null;
}
