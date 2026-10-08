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
  getCitiesByCountryAndState,
  getCountries,
  getStatesByCountry,
  isValidGeographicHierarchy,
} from './geographic-reference.data';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async create(dto: CreateLocationDto, actorId: string): Promise<Location> {
    const name = dto.name.trim();
    const country = dto.country.trim();
    const stateProvince = this.optionalName(dto.stateProvince);
    const city = this.optionalName(dto.city);
    this.validatePhone(dto.phone);
    await this.validateCompany(dto.companyId);
    this.validateGeography(country, stateProvince, city);
    await this.assertNameIsFree(name);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      phone: dto.phone?.trim() || null,
      companyId: dto.companyId ?? null,
      country,
      stateProvince,
      city,
      isActive: true,
      createdById: actorId,
      updatedById: actorId,
    });
    return this.locations.save(location);
  }

  async findAll(query: ListLocationsDto): Promise<Paginated<Location>> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.locations.createQueryBuilder('location');
    const search = query.search?.trim().toLocaleLowerCase('en');
    if (search) {
      qb.andWhere('location.nameNormalized LIKE :search', { search: `%${search}%` });
    }
    const status = query.status ?? 'ACTIVE';
    if (status !== 'ALL') {
      qb.andWhere('location.isActive = :isActive', { isActive: status === 'ACTIVE' });
    }
    if (query.country) {
      qb.andWhere('LOWER(location.country) = LOWER(:country)', { country: query.country.trim() });
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
    const country = dto.country === undefined ? location.country : dto.country.trim();
    const stateProvince = dto.stateProvince === undefined
      ? location.stateProvince
      : this.optionalName(dto.stateProvince);
    const city = dto.city === undefined ? location.city : this.optionalName(dto.city);
    const phone = dto.phone === undefined ? location.phone : dto.phone?.trim() || null;
    const companyId = dto.companyId === undefined ? location.companyId : dto.companyId;

    this.validatePhone(phone);
    await this.validateCompany(companyId);
    this.validateGeography(country, stateProvince, city);
    if (dto.name !== undefined) await this.assertNameIsFree(name, id);

    location.name = name;
    location.nameNormalized = normalizeLocationName(name);
    location.phone = phone;
    location.companyId = companyId ?? null;
    location.country = country;
    location.stateProvince = stateProvince;
    location.city = city;
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
    return getCountries();
  }

  getStates(country: string): string[] {
    if (!country?.trim()) {
      throw new UnprocessableEntityException('A country is required.');
    }
    return getStatesByCountry(country.trim());
  }

  getCities(country: string, stateProvince: string): string[] {
    if (!country?.trim() || !stateProvince?.trim()) {
      throw new UnprocessableEntityException('Country and stateProvince are required.');
    }
    return getCitiesByCountryAndState(country.trim(), stateProvince.trim());
  }

  private async validateCompany(companyId?: string | null): Promise<void> {
    if (companyId == null) return;
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new UnprocessableEntityException('The selected company does not exist.');
  }

  private validateGeography(
    country: string,
    stateProvince?: string | null,
    city?: string | null,
  ): void {
    if (!isValidGeographicHierarchy(country, stateProvince, city)) {
      throw new UnprocessableEntityException(
        'Select a valid country, state/province, and city combination.',
      );
    }
  }

  private validatePhone(phone?: string | null): void {
    if (phone == null) return;
    const trimmed = phone.trim();
    if (trimmed.length > 30 || !/^\+?[0-9\s()-]{6,}$/.test(trimmed)) {
      throw new UnprocessableEntityException('Enter a valid phone number.');
    }
  }

  private optionalName(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A location with this name already exists.');
    }
  }
}

export function normalizeLocationName(name: string): string {
  return name.trim().toLocaleLowerCase('en');
}
