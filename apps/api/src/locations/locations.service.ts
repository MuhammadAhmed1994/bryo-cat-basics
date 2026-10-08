import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationStatus } from './entities/location.entity';

const VALID_PHONE = /^(?=.*\d)\+?[0-9\s()-]{6,30}$/;

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    this.validatePhones(dto.phone, dto.contactPersonPhone);
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      description: dto.description ?? null,
      // New Locations must always start Active, regardless of a submitted status.
      status: LocationStatus.ACTIVE,
      companyId: dto.companyId ?? null,
      phone: dto.phone ?? null,
      contactPersonName: dto.contactPersonName ?? null,
      contactPersonPhone: dto.contactPersonPhone ?? null,
      contactPersonEmail: dto.contactPersonEmail ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
    });
    const saved = await this.locations.save(location);
    return this.findOne(saved.id);
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locations.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!location) throw new NotFoundException('Location not found.');
    return location;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);
    this.validatePhones(dto.phone, dto.contactPersonPhone);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, location.id);
      location.name = name;
      location.nameNormalized = normalizeLocationName(name);
    }

    if (dto.description !== undefined) location.description = dto.description;
    if (dto.status !== undefined) location.status = dto.status;
    if (dto.companyId !== undefined) {
      location.companyId = dto.companyId;
      if (dto.companyId === null) location.company = null;
    }
    if (dto.phone !== undefined) location.phone = dto.phone;
    if (dto.contactPersonName !== undefined) location.contactPersonName = dto.contactPersonName;
    if (dto.contactPersonPhone !== undefined) location.contactPersonPhone = dto.contactPersonPhone;
    if (dto.contactPersonEmail !== undefined) location.contactPersonEmail = dto.contactPersonEmail;
    if (dto.addressLine1 !== undefined) location.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) location.addressLine2 = dto.addressLine2;
    if (dto.country !== undefined) location.country = dto.country;
    if (dto.stateProvince !== undefined) location.stateProvince = dto.stateProvince;
    if (dto.city !== undefined) location.city = dto.city;
    if (dto.postalCode !== undefined) location.postalCode = dto.postalCode;

    const saved = await this.locations.save(location);
    return this.findOne(saved.id);
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A location with this name already exists.');
    }
  }

  private validatePhones(...phones: Array<string | null | undefined>): void {
    for (const phone of phones) {
      if (phone !== undefined && phone !== null && !VALID_PHONE.test(phone.trim())) {
        throw new BadRequestException('Enter a valid phone number.');
      }
    }
  }
}
