import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationStatus } from './entities/location-status.enum';
import { Location } from './entities/location.entity';

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);
    await this.assertCompanyIsActive(dto.companyId);
    this.assertGeography(dto.country, dto.stateProvince, dto.city);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      companyId: dto.companyId ?? null,
      phone: dto.phone ?? null,
      contactPerson: dto.contactPerson ?? null,
      contactPersonPhone: dto.contactPersonPhone ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
      status: LocationStatus.ACTIVE,
    });
    return this.locations.save(location);
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found.');
    return location;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);
    const name = dto.name === undefined ? location.name : dto.name.trim();
    await this.assertNameIsFree(name, location.id);

    const companyId = dto.companyId === undefined ? location.companyId : dto.companyId;
    await this.assertCompanyIsActive(companyId);

    const country = dto.country === undefined ? location.country : dto.country;
    const stateProvince = dto.stateProvince === undefined
      ? location.stateProvince
      : dto.stateProvince;
    const city = dto.city === undefined ? location.city : dto.city;
    this.assertGeography(country, stateProvince, city);

    location.name = name;
    location.nameNormalized = normalizeLocationName(name);
    location.companyId = companyId ?? null;
    if (dto.phone !== undefined) location.phone = dto.phone ?? null;
    if (dto.contactPerson !== undefined) location.contactPerson = dto.contactPerson ?? null;
    if (dto.contactPersonPhone !== undefined) {
      location.contactPersonPhone = dto.contactPersonPhone ?? null;
    }
    if (dto.addressLine1 !== undefined) location.addressLine1 = dto.addressLine1 ?? null;
    if (dto.addressLine2 !== undefined) location.addressLine2 = dto.addressLine2 ?? null;
    if (dto.country !== undefined) location.country = dto.country ?? null;
    if (dto.stateProvince !== undefined) location.stateProvince = dto.stateProvince ?? null;
    if (dto.city !== undefined) location.city = dto.city ?? null;
    if (dto.postalCode !== undefined) location.postalCode = dto.postalCode ?? null;

    return this.locations.save(location);
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A location with this name already exists.');
    }
  }

  private async assertCompanyIsActive(companyId: string | null | undefined): Promise<void> {
    if (companyId == null) return;
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company || !company.isActive) {
      throw new BadRequestException('Select an active company.');
    }
  }

  private assertGeography(
    country: string | null | undefined,
    stateProvince: string | null | undefined,
    city: string | null | undefined,
  ): void {
    if (stateProvince && !country) {
      throw new BadRequestException('Country is required when State/Province is provided.');
    }
    if (city && !stateProvince) {
      throw new BadRequestException('State/Province is required when City is provided.');
    }
  }
}
