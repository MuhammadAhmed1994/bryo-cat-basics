import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location, LocationStatus } from './entities/location.entity';

@Injectable()
export class LocationsQueryService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  /** Returns Locations matching every supplied filter, with their Company loaded. */
  async findAll(query: ListLocationsDto): Promise<Paginated<Location>> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.locations
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.company', 'company');

    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere('location.nameNormalized LIKE :search', {
        search: `%${search}%`,
      });
    }

    const status = query.status ?? LocationStatus.ACTIVE;
    if (status !== 'ALL') {
      qb.andWhere('location.status = :status', { status });
    }

    if (query.country) {
      qb.andWhere('location.country = :country', { country: query.country });
    }

    if (query.companyId) {
      qb.andWhere('location.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    qb.orderBy('location.name', 'ASC').skip(skip).take(perPage);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }
}
