import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value,
);

/** Spec 2.8.1 — every address field is optional; billing and shipping match. */
export class AddressDto {
  @IsOptional() @IsString() @MaxLength(255) @trim line1?: string | null;
  @IsOptional() @IsString() @MaxLength(255) @trim line2?: string | null;
  @IsOptional() @IsString() @MaxLength(100) @trim country?: string | null;
  @IsOptional() @IsString() @MaxLength(100) @trim state?: string | null;
  @IsOptional() @IsString() @MaxLength(100) @trim city?: string | null;
  @IsOptional() @IsString() @MaxLength(20) @trim postalCode?: string | null;
}
