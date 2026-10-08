import {
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
    await this.assertCompanyExists(dto.companyId);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      phone: dto.phone ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      status: LocationStatus.ACTIVE,
      companyId: dto.companyId ?? null,
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

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const normalizedName = normalizeLocationName(name);
      if (normalizedName !== location.nameNormalized) {
        await this.assertNameIsFree(name, location.id);
      }
      location.name = name;
      location.nameNormalized = normalizedName;
    }

    if (dto.phone !== undefined) location.phone = dto.phone;
    if (dto.country !== undefined) location.country = dto.country;
    if (dto.stateProvince !== undefined) location.stateProvince = dto.stateProvince;
    if (dto.city !== undefined) location.city = dto.city;
    if (dto.companyId !== undefined) {
      await this.assertCompanyExists(dto.companyId);
      location.companyId = dto.companyId;
    }

    await this.locations.save(location);
    return this.findOne(location.id);
  }

  private async assertCompanyExists(companyId: string | null | undefined): Promise<void> {
    if (companyId == null) return;
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found.');
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A Location with this name already exists.');
    }
  }
}
