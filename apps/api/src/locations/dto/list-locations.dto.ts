import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ALLOWED_PER_PAGE,
  DEFAULT_PER_PAGE,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

/** Query contract for searching, filtering, sorting, and paging locations. */
export class ListLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(ALLOWED_PER_PAGE)
  perPage = DEFAULT_PER_PAGE;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ALL'])
  status: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ACTIVE';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir: 'ASC' | 'DESC' = 'ASC';
}
