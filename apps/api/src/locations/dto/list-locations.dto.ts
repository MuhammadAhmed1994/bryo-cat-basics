import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { LocationStatus } from '../entities/location.entity';

export class ListLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
