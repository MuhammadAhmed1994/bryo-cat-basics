import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { LocationStatus } from '../entities/location.entity';

/** Query filters accepted by GET /api/locations. */
export class ListLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([...Object.values(LocationStatus), 'ALL'])
  status?: LocationStatus | 'ALL';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyId?: string;
}
