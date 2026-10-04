import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UserStatus } from '../entities/user.entity';

export class ListUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([...Object.values(UserStatus), 'ALL'])
  status?: UserStatus | 'ALL';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC';
}
