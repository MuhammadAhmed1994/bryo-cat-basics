import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationStatus } from './entities/location.entity';

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    const location = this.locations.create({
      name,
      nameNormalized: normalizeLocationName(name),
      phone: dto.phone?.trim() ?? null,
      country: dto.country ?? null,
      stateProvince: dto.stateProvince ?? null,
      city: dto.city ?? null,
      status: LocationStatus.ACTIVE,
      companyId: dto.companyId ?? null,
    });

    try {
      const saved = await this.locations.save(location);
      return (await this.findOne(saved.id));
    } catch (error: unknown) {
      if (this.isNameUniqueViolation(error)) this.throwDuplicateName();
      throw error;
    }
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
    if (dto.phone !== undefined) location.phone = dto.phone?.trim() ?? null;
    if (dto.country !== undefined) location.country = dto.country ?? null;
    if (dto.stateProvince !== undefined) location.stateProvince = dto.stateProvince ?? null;
    if (dto.city !== undefined) location.city = dto.city ?? null;
    if (dto.companyId !== undefined) location.companyId = dto.companyId;

    try {
      await this.locations.save(location);
      return this.findOne(location.id);
    } catch (error: unknown) {
      if (this.isNameUniqueViolation(error)) this.throwDuplicateName();
      throw error;
    }
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.locations.findOne({
      where: { nameNormalized: normalizeLocationName(name) },
    });
    if (existing && existing.id !== exceptId) this.throwDuplicateName();
  }

  private throwDuplicateName(): never {
    throw new ConflictException({
      message: 'A location with this name already exists.',
      field: 'name',
      code: 'LOCATION_NAME_CONFLICT',
    });
  }

  private isNameUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as { code?: string; constraint?: string };
    return driverError.code === '23505' &&
      driverError.constraint === 'ux_locations_name_normalized';
  }
}
