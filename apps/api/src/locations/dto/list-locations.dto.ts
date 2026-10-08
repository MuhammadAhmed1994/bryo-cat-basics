import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { LocationStatus } from '../entities/location-status.enum';

export const LOCATION_LIST_STATUSES = [
  'ALL',
  LocationStatus.ACTIVE,
  LocationStatus.INACTIVE,
] as const;
export type LocationListStatus = (typeof LOCATION_LIST_STATUSES)[number];

/** Validated filters for the paginated Location browse endpoint. */
export class ListLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(LOCATION_LIST_STATUSES)
  status?: LocationListStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC';
}
