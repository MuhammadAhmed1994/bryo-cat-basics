import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(@InjectRepository(Location) private readonly locations: Repository<Location>) {}

  async create(dto: CreateLocationDto, actorId: string): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeName(name),
      companyId: dto.companyId ?? null,
      phone: dto.phone?.trim() ?? null,
      contactPersonName: dto.contactPersonName ?? null,
      contactPersonPhone: dto.contactPersonPhone?.trim() ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
      status: 'ACTIVE',
      addedById: actorId,
      updatedById: actorId,
    });

    return this.locations.save(location);
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found.');
    return location;
  }

  async update(id: string, dto: UpdateLocationDto, actorId: string): Promise<Location> {
    const location = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, location.id);
      location.name = name;
      location.nameNormalized = normalizeName(name);
    }

    if (dto.companyId !== undefined) location.companyId = dto.companyId ?? null;
    if (dto.phone !== undefined) location.phone = dto.phone?.trim() ?? null;
    if (dto.contactPersonName !== undefined)
      location.contactPersonName = dto.contactPersonName ?? null;
    if (dto.contactPersonPhone !== undefined)
      location.contactPersonPhone = dto.contactPersonPhone?.trim() ?? null;
    if (dto.addressLine1 !== undefined) location.addressLine1 = dto.addressLine1 ?? null;
    if (dto.addressLine2 !== undefined) location.addressLine2 = dto.addressLine2 ?? null;
    if (dto.country !== undefined) location.country = dto.country ?? null;
    if (dto.stateProvince !== undefined) location.stateProvince = dto.stateProvince ?? null;
    if (dto.city !== undefined) location.city = dto.city ?? null;
    if (dto.postalCode !== undefined) location.postalCode = dto.postalCode ?? null;

    location.updatedById = actorId;
    return this.locations.save(location);
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
      qb.andWhere('location.companyId = :companyId', { companyId: query.company });
    }

    qb.orderBy('location.name', query.sortDir ?? 'ASC').skip(skip).take(perPage);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({ where: { nameNormalized: normalizeName(name) } });
    if (existing && existing.id !== exceptId) {
      throw new BadRequestException('A location with this name already exists.');
    }
  }
}
