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
import { Company } from '../companies/entities/company.entity';
import { Location, LocationStatus } from './entities/location.entity';

const PHONE_PATTERN = /^(?=.*[0-9])\+?[0-9\s()-]{6,}$/;

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
    this.validatePhones(dto);
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      description: dto.description ?? null,
      // New locations are always Active, even when a caller supplies a status.
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
    this.validatePhones(dto);
    const location = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, location.id);
      location.name = name;
      location.nameNormalized = normalizeLocationName(name);
    }

    const fields: Array<keyof UpdateLocationDto> = [
      'description',
      'status',
      'companyId',
      'phone',
      'contactPersonName',
      'contactPersonPhone',
      'contactPersonEmail',
      'addressLine1',
      'addressLine2',
      'country',
      'stateProvince',
      'city',
      'postalCode',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        (location as unknown as Record<string, unknown>)[field] = dto[field];
      }
    }
    if (dto.companyId === null) {
      location.company = null;
    } else if (dto.companyId !== undefined) {
      location.company = { id: dto.companyId } as Company;
    }

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

  private validatePhones(dto: CreateLocationDto | UpdateLocationDto): void {
    for (const field of ['phone', 'contactPersonPhone'] as const) {
      const value = dto[field];
      if (value != null && !PHONE_PATTERN.test(value.trim())) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: { [field]: 'Enter a valid phone number.' },
        });
      }
    }
  }
}
