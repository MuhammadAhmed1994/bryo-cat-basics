import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ListLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['ALL', 'ACTIVE', 'INACTIVE'])
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  /** Company filter by id; nullable values are ignored. */
  @IsOptional()
  @IsUUID()
  company?: string;
}
