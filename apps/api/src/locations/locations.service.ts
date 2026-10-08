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
import { Location } from './entities/location.entity';
import { LocationStatus } from './entities/location-status.enum';

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

function optionalText(value: string | null | undefined): string | null {
  return typeof value === 'string' ? value.trim() || null : value ?? null;
}

function assertPhone(value: string | null | undefined): void {
  if (value == null || value.trim() === '') return;
  const phone = value.trim();
  if (!/^\+?[0-9\s()-]+$/.test(phone) || (phone.match(/[0-9]/g) ?? []).length < 6) {
    throw new BadRequestException('Enter a valid phone number.');
  }
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async create(dto: CreateLocationDto, actorId: string): Promise<Location> {
    void actorId;
    const name = dto.name.trim();
    await this.assertNameIsFree(name);
    await this.assertCompanyIsActive(dto.companyId);
    assertPhone(dto.phone);
    assertPhone(dto.contactPersonPhone);
    this.assertGeography(dto.country, dto.stateProvince, dto.city);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      companyId: dto.companyId ?? null,
      phone: optionalText(dto.phone),
      contactPerson: optionalText(dto.contactPerson),
      contactPersonPhone: optionalText(dto.contactPersonPhone),
      addressLine1: optionalText(dto.addressLine1),
      addressLine2: optionalText(dto.addressLine2),
      country: optionalText(dto.country),
      stateProvince: optionalText(dto.stateProvince),
      city: optionalText(dto.city),
      postalCode: optionalText(dto.postalCode),
      status: LocationStatus.ACTIVE,
    });
    return this.locations.save(location);
  }

  async update(id: string, dto: UpdateLocationDto, actorId: string): Promise<Location> {
    void actorId;
    const location = await this.findOne(id);
    const name = dto.name === undefined ? location.name : dto.name.trim();
    if (dto.name !== undefined) await this.assertNameIsFree(name, location.id);
    if (dto.companyId !== undefined) await this.assertCompanyIsActive(dto.companyId);

    const phone = dto.phone === undefined ? location.phone : dto.phone;
    const contactPersonPhone = dto.contactPersonPhone === undefined
      ? location.contactPersonPhone
      : dto.contactPersonPhone;
    assertPhone(phone);
    assertPhone(contactPersonPhone);

    const country = dto.country === undefined ? location.country : dto.country;
    const stateProvince = dto.stateProvince === undefined
      ? location.stateProvince
      : dto.stateProvince;
    const city = dto.city === undefined ? location.city : dto.city;
    this.assertGeography(country, stateProvince, city);

    if (dto.name !== undefined) {
      location.name = name;
      location.nameNormalized = normalizeLocationName(name);
    }
    if (dto.companyId !== undefined) location.companyId = dto.companyId;
    if (dto.phone !== undefined) location.phone = optionalText(dto.phone);
    if (dto.contactPerson !== undefined) {
      location.contactPerson = optionalText(dto.contactPerson);
    }
    if (dto.contactPersonPhone !== undefined) {
      location.contactPersonPhone = optionalText(dto.contactPersonPhone);
    }
    if (dto.addressLine1 !== undefined) location.addressLine1 = optionalText(dto.addressLine1);
    if (dto.addressLine2 !== undefined) location.addressLine2 = optionalText(dto.addressLine2);
    if (dto.country !== undefined) location.country = optionalText(dto.country);
    if (dto.stateProvince !== undefined) location.stateProvince = optionalText(dto.stateProvince);
    if (dto.city !== undefined) location.city = optionalText(dto.city);
    if (dto.postalCode !== undefined) location.postalCode = optionalText(dto.postalCode);

    return this.locations.save(location);
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found.');
    return location;
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
    const company = await this.companies.findOne({ where: { id: companyId, isActive: true } });
    if (!company) {
      throw new BadRequestException('Select an active company or leave the company blank.');
    }
  }

  private assertGeography(
    country: string | null | undefined,
    stateProvince: string | null | undefined,
    city: string | null | undefined,
  ): void {
    if (stateProvince?.trim() && !country?.trim()) {
      throw new BadRequestException('Select a country before entering a State/Province.');
    }
    if (city?.trim() && !stateProvince?.trim()) {
      throw new BadRequestException('Select a State/Province before entering a city.');
    }
  }
}
