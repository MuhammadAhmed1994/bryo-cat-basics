import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Spec 2.2.7 — 50 rows per page by default, 25/50/100 selectable. */
export const DEFAULT_PER_PAGE = 50;
export const ALLOWED_PER_PAGE = [25, 50, 100];

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(ALLOWED_PER_PAGE)
  perPage?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(200)
  search?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export function resolvePaging(page?: number, perPage?: number) {
  const resolvedPerPage = ALLOWED_PER_PAGE.includes(perPage ?? 0)
    ? (perPage as number)
    : DEFAULT_PER_PAGE;
  const resolvedPage = page && page > 0 ? page : 1;
  return {
    page: resolvedPage,
    perPage: resolvedPerPage,
    skip: (resolvedPage - 1) * resolvedPerPage,
  };
}
