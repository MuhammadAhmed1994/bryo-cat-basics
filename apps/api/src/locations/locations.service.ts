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
import { Location, LocationStatus } from './entities/location.entity';

const PHONE_PATTERN = /^(?=.*\d)\+?[0-9\s()-]{6,}$/;

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
    this.validatePhones(dto.phone, dto.contactPersonPhone);

    const company = await this.resolveCompany(dto.companyId);
    const location = this.locations.create({
      ...dto,
      name,
      nameNormalized: normalizeLocationName(name),
      status: dto.status ?? LocationStatus.ACTIVE,
      companyId: company?.id ?? null,
      company,
    });
    return this.locations.save(location);
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

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, location.id);
      location.name = name;
      location.nameNormalized = normalizeLocationName(name);
    }
    this.validatePhones(dto.phone, dto.contactPersonPhone);

    const nullableFields: (keyof UpdateLocationDto)[] = [
      'description',
      'status',
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
    for (const field of nullableFields) {
      if (dto[field] !== undefined) {
        (location as unknown as Record<string, unknown>)[field] = dto[field];
      }
    }

    if (dto.companyId !== undefined) {
      const company = await this.resolveCompany(dto.companyId);
      location.company = company;
      location.companyId = company?.id ?? null;
    }

    const saved = await this.locations.save(location);
    // Ensure callers receive the current Company values after a changed relation.
    return dto.companyId !== undefined ? this.findOne(saved.id) : saved;
  }

  private async resolveCompany(companyId: string | null | undefined): Promise<Company | null> {
    if (companyId == null) return null;
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new BadRequestException('The selected company does not exist.');
    return company;
  }

  private validatePhones(...phones: (string | null | undefined)[]): void {
    for (const phone of phones) {
      if (phone == null) continue;
      const normalized = phone.trim();
      if (normalized.length > 30 || !PHONE_PATTERN.test(normalized)) {
        throw new BadRequestException('Enter a valid phone number.');
      }
    }
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
