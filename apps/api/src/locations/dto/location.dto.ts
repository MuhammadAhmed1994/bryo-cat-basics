import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

const PHONE_PATTERN = /^(?=.*\d)\+?[0-9 ()\-.]{7,25}$/;

export class CreateLocationDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN)
  contactPersonPhone?: string | null;

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
  @MaxLength(25)
  companyId?: string | null;
}

export class UpdateLocationDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN)
  contactPersonPhone?: string | null;

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
  @MaxLength(25)
  companyId?: string | null;
}

export class ListLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ALL'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  companyId?: string;

  /** Alias accepted by clients that name the association filter "company". */
  @IsOptional()
  @IsString()
  @MaxLength(25)
  company?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}
