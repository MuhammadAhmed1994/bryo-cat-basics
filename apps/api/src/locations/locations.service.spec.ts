import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationStatus } from './entities/location-status.enum';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

type RepositoryMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-uuid',
    name: 'North Farm',
    nameNormalized: 'north farm',
    companyId: null,
    phone: null,
    contactPerson: null,
    contactPersonPhone: null,
    addressLine1: null,
    addressLine2: null,
    country: null,
    stateProvince: null,
    city: null,
    postalCode: null,
    status: LocationStatus.ACTIVE,
    ...overrides,
  });
}

describe('LocationsService', () => {
  let service: LocationsService;
  let controller: LocationsController;
  let locations: RepositoryMock;
  let companies: RepositoryMock;

  beforeEach(async () => {
    locations = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data: Partial<Location>) => Object.assign(new Location(), data)),
      save: jest.fn(async (location: Location) =>
        Object.assign(location, { id: location.id ?? 'created-location-uuid' }),
      ),
    };
    companies = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locations },
        { provide: getRepositoryToken(Company), useValue: companies },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
    controller = new LocationsController(service);
  });

  it('[AC-2] creates an Active Location without a Company and returns its success message', async () => {
    const result = await controller.create({ name: '  North Farm  ' } as CreateLocationDto);

    expect(locations.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'North Farm',
      nameNormalized: 'north farm',
      companyId: null,
      status: LocationStatus.ACTIVE,
    }));
    expect(result.message).toBe('Location added successfully.');
    expect(result.companyId).toBeNull();
  });

  it('[AC-3] rejects invalid DTO values, duplicates, geography, and Companies without saving', async () => {
    const missingName = Object.assign(new CreateLocationDto(), {});
    const longName = Object.assign(new CreateLocationDto(), { name: 'x'.repeat(101) });
    const invalidPhone = Object.assign(new CreateLocationDto(), {
      name: 'South Farm', phone: 'not a phone', contactPersonPhone: 'also invalid',
    });
    expect(await validate(missingName)).not.toHaveLength(0);
    expect(await validate(longName)).not.toHaveLength(0);
    expect(await validate(invalidPhone)).not.toHaveLength(0);

    locations.findOne.mockResolvedValueOnce(makeLocation());
    await expect(service.create({ name: 'NORTH FARM' } as CreateLocationDto))
      .rejects.toThrow(ConflictException);

    locations.findOne.mockResolvedValue(null);
    await expect(service.create({
      name: 'South Farm',
      stateProvince: 'NSW',
    } as CreateLocationDto)).rejects.toThrow(BadRequestException);
    await expect(service.create({
      name: 'South Farm',
      country: 'Australia',
      city: 'Dubbo',
    } as CreateLocationDto)).rejects.toThrow(BadRequestException);

    companies.findOne.mockResolvedValueOnce(null);
    await expect(service.create({
      name: 'South Farm',
      companyId: '2b7a9ed4-1c3a-4d8c-95bf-642b7a34a8e1',
    } as CreateLocationDto)).rejects.toThrow(BadRequestException);
    companies.findOne.mockResolvedValueOnce({ id: 'inactive-company', isActive: false });
    await expect(service.create({
      name: 'South Farm',
      companyId: '2b7a9ed4-1c3a-4d8c-95bf-642b7a34a8e1',
    } as CreateLocationDto)).rejects.toThrow(BadRequestException);

    expect(locations.save).not.toHaveBeenCalled();
  });

  it('[AC-6] permits keeping, changing, or clearing Company and rejects another Location name without saving', async () => {
    const current = makeLocation({ companyId: 'company-uuid' });
    locations.findOne.mockImplementation(async (options: { where: Record<string, string> }) => {
      if (options.where.id) return current;
      if (options.where.nameNormalized === 'other') {
        return makeLocation({ id: 'another-location', nameNormalized: 'other' });
      }
      return current;
    });
    companies.findOne.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      isActive: true,
    }));

    const kept = await service.update('location-uuid', {} as UpdateLocationDto);
    expect(kept.companyId).toBe('company-uuid');
    const changed = await service.update('location-uuid', {
      companyId: 'another-company-uuid',
    } as UpdateLocationDto);
    expect(changed.companyId).toBe('another-company-uuid');
    const cleared = await service.update('location-uuid', {
      companyId: null,
    } as UpdateLocationDto);
    expect(cleared.companyId).toBeNull();
    expect(locations.save).toHaveBeenCalledTimes(3);

    await expect(service.update('location-uuid', { name: 'Other' } as UpdateLocationDto))
      .rejects.toThrow(ConflictException);
    expect(locations.save).toHaveBeenCalledTimes(3);
  });
});
