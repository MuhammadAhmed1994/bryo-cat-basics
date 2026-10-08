import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location } from './entities/location.entity';
import { LocationStatus } from './entities/location-status.enum';

@Injectable()
export class LocationQueriesService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  async findAll(query: ListLocationsDto): Promise<Paginated<Location>> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.locations.createQueryBuilder('location');
    const search = query.search?.trim().toLowerCase();

    if (search) {
      qb.andWhere('LOWER(location.name) LIKE :search', {
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

    qb.orderBy('location.name', query.sortDir ?? 'ASC').skip(skip).take(perPage);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!location) {
      throw new NotFoundException('Location not found.');
    }
    return location;
  }
}
