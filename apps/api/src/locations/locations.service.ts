import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import {
  getGeographicCities,
  getGeographicCountries,
  getGeographicStates,
  isValidGeographicHierarchy,
} from './geographic-reference.data';

export interface LocationOperationResult {
  message: string;
}

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
    await this.validateFields(dto);
    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      phone: dto.phone?.trim() || null,
      companyId: dto.companyId ?? null,
      country: dto.country.trim(),
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      isActive: true,
      createdById: actorId,
      updatedById: actorId,
    });
    return this.locations.save(location);
  }

  async findAll(query: Partial<ListLocationsDto>): Promise<Paginated<Location>> {
    const parsedPageSize = Number(query.perPage);
    const { page, perPage, skip } = resolvePaging(
      query.page,
      Number.isFinite(parsedPageSize) ? parsedPageSize : undefined,
    );
    const qb = this.locations.createQueryBuilder('location');
    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere('location.nameNormalized LIKE :search', { search: `%${search}%` });
    }
    const status = query.status ?? 'ACTIVE';
    if (status !== 'ALL') {
      qb.andWhere('location.isActive = :isActive', { isActive: status === 'ACTIVE' });
    }
    if (query.country) {
      qb.andWhere('location.country = :country', { country: query.country });
    }
    if (query.companyId) {
      qb.andWhere('location.companyId = :companyId', { companyId: query.companyId });
    }
    qb.orderBy('location.name', query.sortDir ?? 'ASC').skip(skip).take(perPage);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found.');
    return location;
  }

  async update(id: string, dto: UpdateLocationDto, actorId: string): Promise<Location> {
    const location = await this.findOne(id);
    const name = dto.name === undefined ? location.name : dto.name.trim();
    if (dto.name !== undefined) await this.assertNameIsFree(name, id);

    const candidate = {
      companyId: dto.companyId === undefined ? location.companyId : dto.companyId,
      phone: dto.phone === undefined ? location.phone : dto.phone,
      country: dto.country === undefined ? location.country : dto.country,
      stateProvince:
        dto.stateProvince === undefined ? location.stateProvince : dto.stateProvince,
      city: dto.city === undefined ? location.city : dto.city,
    };
    await this.validateFields(candidate);

    location.name = name;
    location.nameNormalized = normalizeLocationName(name);
    location.companyId = candidate.companyId ?? null;
    location.phone = candidate.phone?.trim() || null;
    location.country = candidate.country.trim();
    location.stateProvince = candidate.stateProvince ?? null;
    location.city = candidate.city ?? null;
    location.updatedById = actorId;
    return this.locations.save(location);
  }

  async setStatus(id: string, isActive: boolean, actorId: string): Promise<Location> {
    const location = await this.findOne(id);
    location.isActive = isActive;
    location.updatedById = actorId;
    return this.locations.save(location);
  }

  getCountries(): string[] {
    return getGeographicCountries();
  }

  getStates(country: string): string[] {
    return getGeographicStates(country);
  }

  getCities(country: string, stateProvince: string): string[] {
    return getGeographicCities(country, stateProvince);
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A location with this name already exists.');
    }
  }

  private async validateFields(fields: {
    companyId?: string | null;
    phone?: string | null;
    country: string;
    stateProvince?: string | null;
    city?: string | null;
  }): Promise<void> {
    if (fields.companyId) {
      const company = await this.companies.findOne({ where: { id: fields.companyId } });
      if (!company) {
        throw new UnprocessableEntityException('Select a valid company.');
      }
    }
    if (fields.phone && !/^\+?[0-9\s()-]{6,}$/.test(fields.phone.trim())) {
      throw new UnprocessableEntityException('Enter a valid phone number.');
    }
    if (!isValidGeographicHierarchy(fields.country, fields.stateProvince, fields.city)) {
      throw new UnprocessableEntityException('Select a valid country, state/province, and city.');
    }
  }
}
