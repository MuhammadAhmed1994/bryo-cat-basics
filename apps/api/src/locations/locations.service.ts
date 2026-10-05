import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location, LocationStatus } from './entities/location.entity';

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
  ) {}

  async create(dto: CreateLocationDto, actorId: string): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      companyId: dto.companyId ?? null,
      phone: dto.phone?.trim() ?? null,
      contactPersonName: dto.contactPersonName?.trim() ?? null,
      contactPersonPhone: dto.contactPersonPhone?.trim() ?? null,
      addressLine1: dto.addressLine1?.trim() ?? null,
      addressLine2: dto.addressLine2?.trim() ?? null,
      country: dto.country?.trim() ?? null,
      stateProvince: dto.stateProvince?.trim() ?? null,
      city: dto.city?.trim() ?? null,
      postalCode: dto.postalCode?.trim() ?? null,
      status: LocationStatus.ACTIVE,
      createdById: actorId,
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
      location.nameNormalized = normalizeLocationName(name);
    }

    if (dto.companyId !== undefined) location.companyId = dto.companyId ?? null;
    if (dto.phone !== undefined) location.phone = dto.phone?.trim() ?? null;
    if (dto.contactPersonName !== undefined)
      location.contactPersonName = dto.contactPersonName?.trim() ?? null;
    if (dto.contactPersonPhone !== undefined)
      location.contactPersonPhone = dto.contactPersonPhone?.trim() ?? null;
    if (dto.addressLine1 !== undefined) location.addressLine1 = dto.addressLine1?.trim() ?? null;
    if (dto.addressLine2 !== undefined) location.addressLine2 = dto.addressLine2?.trim() ?? null;
    if (dto.country !== undefined) location.country = dto.country?.trim() ?? null;
    if (dto.stateProvince !== undefined)
      location.stateProvince = dto.stateProvince?.trim() ?? null;
    if (dto.city !== undefined) location.city = dto.city?.trim() ?? null;
    if (dto.postalCode !== undefined) location.postalCode = dto.postalCode?.trim() ?? null;
    if (dto.status !== undefined) location.status = dto.status;

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
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      // Spec wants a 400 with this message rather than 409
      throw new BadRequestException('A location with this name already exists.');
    }
  }
}
