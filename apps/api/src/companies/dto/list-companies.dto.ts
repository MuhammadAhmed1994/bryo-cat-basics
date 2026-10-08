import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/** Available status filters for the Company list endpoint. */
export const COMPANY_LIST_STATUSES = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
export type CompanyListStatus = (typeof COMPANY_LIST_STATUSES)[number];

/** Spec 2.8.7 — status chips (All / Inactive), country dropdown, name sort. */
export class ListCompaniesDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(COMPANY_LIST_STATUSES)
  status?: CompanyListStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC';
}
