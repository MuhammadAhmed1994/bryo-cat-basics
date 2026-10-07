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

type LocationDtoField =
  | 'phone'
  | 'contactPerson'
  | 'contactPersonPhone'
  | 'addressLine1'
  | 'addressLine2'
  | 'country'
  | 'stateProvince'
  | 'city'
  | 'postalCode';

export function normalizeLocationName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);
    const companyId = await this.resolveCompanyId(dto.companyId);

    const values = this.valuesFromDto(dto);
    this.assertGeography(values.country, values.stateProvince, values.city);

    const location = this.locations.create({
      ...values,
      name,
      nameNormalized: normalizeLocationName(name),
      companyId,
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

    const companyId = dto.companyId === undefined
      ? location.companyId
      : await this.resolveCompanyId(dto.companyId);
    const values = this.valuesFromDto(dto);
    const country = values.country === undefined ? location.country : values.country;
    const stateProvince = values.stateProvince === undefined
      ? location.stateProvince
      : values.stateProvince;
    const city = values.city === undefined ? location.city : values.city;
    this.assertGeography(country, stateProvince, city);

    Object.assign(location, values, {
      name,
      nameNormalized: normalizeLocationName(name),
      companyId,
    });
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

  private async resolveCompanyId(companyId?: string | null): Promise<string | null> {
    if (companyId === undefined || companyId === null) return null;
    const company = await this.companies.findOne({
      where: { id: companyId, isActive: true },
    });
    if (!company) {
      throw new BadRequestException('Select an active company.');
    }
    return company.id;
  }

  private assertGeography(
    country: string | null | undefined,
    stateProvince: string | null | undefined,
    city: string | null | undefined,
  ): void {
    if (stateProvince && !country) {
      throw new BadRequestException('Select a country before entering State/Province.');
    }
    if (city && !stateProvince) {
      throw new BadRequestException('Select State/Province before entering a city.');
    }
  }

  private valuesFromDto(
    dto: CreateLocationDto | UpdateLocationDto,
  ): Partial<Location> {
    const fields: LocationDtoField[] = [
      'phone',
      'contactPerson',
      'contactPersonPhone',
      'addressLine1',
      'addressLine2',
      'country',
      'stateProvince',
      'city',
      'postalCode',
    ];
    const values: Partial<Location> = {};
    for (const field of fields) {
      const value = dto[field];
      if (value !== undefined) {
        if ((field === 'phone' || field === 'contactPersonPhone') && value !== null &&
          !/^\+?[0-9\s()-]{6,}$/.test(value)) {
          throw new BadRequestException('Enter a valid phone number.');
        }
        (values as Record<string, unknown>)[field] = value;
      } else if (dto instanceof CreateLocationDto) {
        (values as Record<string, unknown>)[field] = null;
      }
    }
    return values;
  }
}
