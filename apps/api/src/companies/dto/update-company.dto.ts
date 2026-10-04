import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './company-address.dto';

/** Spec 2.8.3 — edit applies the same validation rules as add, all optional. */
export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Enter a company name' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString({ message: 'Enter a valid phone number.' })
  @MaxLength(30, { message: 'Enter a valid phone number.' })
  @Matches(/^\+?[0-9\s()-]{6,}$/, { message: 'Enter a valid phone number.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() || null : value,
  )
  email?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Enter a valid URL.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  website?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsOptional()
  @IsBoolean()
  shippingSameAsBilling?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;
}
