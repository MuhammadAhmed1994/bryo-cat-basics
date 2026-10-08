import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto, ListLocationsDto, UpdateLocationDto } from './dto/location.dto';
import { Location, LocationStatus } from './entities/location.entity';

export interface LocationListRow {
  id: string;
  name: string;
  company: string;
  companyId: string | null;
  status: LocationStatus;
  country: string | null;
}

export interface LocationListResult extends Paginated<LocationListRow> {}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);
    const company = await this.resolveCompany(dto.companyId);
    const location = this.locations.create({
      name,
      phone: dto.phone ?? null,
      contactPersonPhone: dto.contactPersonPhone ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      status: LocationStatus.ACTIVE,
      companyId: company?.id ?? null,
      company,
    });
    const saved = await this.locations.save(location);
    saved.company = company;
    saved.companyId = company?.id ?? null;
    return saved;
  }

  async findAll(query: ListLocationsDto): Promise<LocationListResult> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.locations.createQueryBuilder('location');
    qb.leftJoinAndSelect('location.company', 'company');

    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere('LOWER(location.name) LIKE :search', { search: `%${search}%` });
    }

    const status = query.status ?? 'ACTIVE';
    if (status !== 'ALL') {
      qb.andWhere('location.status = :status', { status });
    }
    if (query.country) {
      qb.andWhere('location.country = :country', { country: query.country });
    }
    const companyId = query.companyId ?? query.company;
    if (companyId) {
      qb.andWhere('location.companyId = :companyId', { companyId });
    }

    qb.orderBy('location.name', 'ASC').skip(skip).take(perPage);
    const [locations, total] = await qb.getManyAndCount();
    const data = locations.map((location) => ({
      id: location.id,
      name: location.name,
      company: location.company?.name ?? '-',
      companyId: location.companyId ?? null,
      status: location.status,
      country: location.country ?? null,
    }));
    return { data, total, page, perPage };
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({ where: { id }, relations: { company: true } });
    if (!location) throw new NotFoundException('Location not found.');
    return location;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, location.id);
      location.name = name;
    }

    if (dto.phone !== undefined) location.phone = dto.phone ?? null;
    if (dto.contactPersonPhone !== undefined) {
      location.contactPersonPhone = dto.contactPersonPhone ?? null;
    }
    if (dto.country !== undefined) location.country = dto.country ?? null;
    if (dto.stateProvince !== undefined) location.stateProvince = dto.stateProvince ?? null;
    if (dto.city !== undefined) location.city = dto.city ?? null;
    if (dto.companyId !== undefined) {
      const company = await this.resolveCompany(dto.companyId);
      location.company = company;
      location.companyId = company?.id ?? null;
    }

    const saved = await this.locations.save(location);
    return saved;
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations
      .createQueryBuilder('location')
      .where('LOWER(location.name) = LOWER(:name)', { name })
      .getOne();
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A location with this name already exists.');
    }
  }

  private async resolveCompany(companyId?: string | null): Promise<Company | null> {
    if (companyId == null) return null;
    const company = await this.companies.findOne({ where: { id: companyId, isActive: true } });
    if (!company) {
      throw new UnprocessableEntityException('The selected company is not active or does not exist.');
    }
    return company;
  }
}

/** Checker registered by the Locations module for guarded Company deletion. */
@Injectable()
export class LocationCompanyUsageChecker {
  readonly label = 'locations';

  constructor(@InjectRepository(Location) private readonly locations: Repository<Location>) {}

  countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}
