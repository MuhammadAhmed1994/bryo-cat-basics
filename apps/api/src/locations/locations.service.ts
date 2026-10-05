import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { Company } from '../companies/entities/company.entity';
import { Location, LocationStatus } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async create(dto: CreateLocationDto, actorId: string): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    if (dto.companyId) await this.assertCompanyExists(dto.companyId);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      companyId: dto.companyId ?? null,
      phone: dto.phone ?? null,
      contactPersonName: dto.contactPersonName ?? null,
      contactPersonPhone: dto.contactPersonPhone ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
      status: LocationStatus.ACTIVE,
      createdById: actorId,
      updatedById: actorId,
    });

    return this.locations.save(location);
  }

  async findOne(id: string): Promise<Location> {
    const loc = await this.locations.findOne({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found.');
    return loc;
  }

  async update(id: string, dto: UpdateLocationDto, actorId: string): Promise<Location> {
    const loc = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, loc.id);
      loc.name = name;
      loc.nameNormalized = normalizeLocationName(name);
    }

    if (dto.companyId !== undefined) {
      if (dto.companyId) await this.assertCompanyExists(dto.companyId);
      loc.companyId = dto.companyId ?? null;
    }

    if (dto.phone !== undefined) loc.phone = dto.phone ?? null;
    if (dto.contactPersonName !== undefined)
      loc.contactPersonName = dto.contactPersonName ?? null;
    if (dto.contactPersonPhone !== undefined)
      loc.contactPersonPhone = dto.contactPersonPhone ?? null;
    if (dto.addressLine1 !== undefined) loc.addressLine1 = dto.addressLine1 ?? null;
    if (dto.addressLine2 !== undefined) loc.addressLine2 = dto.addressLine2 ?? null;
    if (dto.country !== undefined) loc.country = dto.country ?? null;
    if (dto.stateProvince !== undefined) loc.stateProvince = dto.stateProvince ?? null;
    if (dto.city !== undefined) loc.city = dto.city ?? null;
    if (dto.postalCode !== undefined) loc.postalCode = dto.postalCode ?? null;

    loc.updatedById = actorId;
    return this.locations.save(loc);
  }

  async findAll(query: ListLocationsDto): Promise<Paginated<Location>> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.locations.createQueryBuilder('location');

    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere('location.nameNormalized LIKE :search', { search: `%${search}%` });
    }

    const status = query.status ?? 'ACTIVE';
    if (status !== 'ALL') {
      qb.andWhere('location.status = :status', { status });
    }

    if (query.country) {
      qb.andWhere('location.country = :country', { country: query.country });
    }

    if (query.company) {
      qb.andWhere('location.companyId = :company', { company: query.company });
    }

    qb.orderBy('location.name', 'ASC').skip(skip).take(perPage);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new BadRequestException('A location with this name already exists.');
    }
  }

  private async assertCompanyExists(id: string): Promise<void> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new BadRequestException('Company not found.');
  }
}
