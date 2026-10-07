import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationStatus } from './entities/location-status.enum';
import { LocationsService } from './locations.service';

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-1',
    name: 'Central Clinic',
    nameNormalized: 'central clinic',
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

function makeCompany(overrides: Partial<Company> = {}): Company {
  return Object.assign(new Company(), {
    id: 'company-1',
    name: 'Northstar',
    nameNormalized: 'northstar',
    isActive: true,
    ...overrides,
  });
}

describe('LocationsService', () => {
  let service: LocationsService;
  let locations: RepoMock;
  let companies: RepoMock;

  beforeEach(async () => {
    locations = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((values) => Object.assign(new Location(), values)),
      save: jest.fn(async (location) => location),
    };
    companies = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locations },
        { provide: getRepositoryToken(Company), useValue: companies },
      ],
    }).compile();
    service = moduleRef.get(LocationsService);
  });

  it('[AC-2] creates a trimmed Active Location with a null Company when absent', async () => {
    const created = await service.create({ name: '  Central Clinic  ' } as CreateLocationDto);

    expect(created.name).toBe('Central Clinic');
    expect(created.nameNormalized).toBe('central clinic');
    expect(created.companyId).toBeNull();
    expect(created.status).toBe(LocationStatus.ACTIVE);
    expect(locations.save).toHaveBeenCalledWith(created);
  });

  it('[AC-3] rejects invalid names, duplicate names, phones, geography, and Companies without saving', async () => {
    expect(validateSync(plainToInstance(CreateLocationDto, {})).length).toBeGreaterThan(0);
    expect(validateSync(plainToInstance(CreateLocationDto, { name: 'x'.repeat(101) })).length)
      .toBeGreaterThan(0);

    locations.findOne.mockResolvedValue(makeLocation());
    await expect(service.create({ name: 'CENTRAL CLINIC' } as CreateLocationDto))
      .rejects.toThrow(ConflictException);

    locations.findOne.mockResolvedValue(null);
    await expect(service.create({ name: 'New Site', phone: 'bad' } as CreateLocationDto))
      .rejects.toThrow(BadRequestException);
    await expect(service.create({ name: 'New Site', contactPersonPhone: 'bad' } as CreateLocationDto))
      .rejects.toThrow(BadRequestException);
    await expect(service.create({ name: 'New Site', stateProvince: 'NSW' } as CreateLocationDto))
      .rejects.toThrow(BadRequestException);
    await expect(service.create({ name: 'New Site', country: 'Australia', city: 'Sydney' } as CreateLocationDto))
      .rejects.toThrow(BadRequestException);
    companies.findOne.mockResolvedValue(null);
    await expect(service.create({ name: 'New Site', companyId: 'missing' } as CreateLocationDto))
      .rejects.toThrow(BadRequestException);
    expect(locations.save).not.toHaveBeenCalled();
  });

  it('[AC-6] updates Company association and permits its own name but rejects another Location name without saving', async () => {
    const existing = makeLocation({
      companyId: 'company-1',
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Sydney',
    });
    locations.findOne.mockImplementation(async ({ where }: { where: { id?: string; nameNormalized?: string } }) => {
      if (where.nameNormalized === 'central clinic') return existing;
      if (where.id === existing.id) return existing;
      return null;
    });
    companies.findOne.mockImplementation(async ({ where }: { where: { id: string } }) =>
      makeCompany({ id: where.id }));

    const kept = await service.update(existing.id, {
      name: 'Central Clinic',
    } as UpdateLocationDto);
    expect(kept.companyId).toBe('company-1');
    expect(locations.save).toHaveBeenCalledTimes(1);

    const changed = await service.update(existing.id, {
      companyId: 'company-2',
    } as UpdateLocationDto);
    expect(changed.companyId).toBe('company-2');
    expect(locations.save).toHaveBeenCalledTimes(2);

    locations.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(makeLocation({ id: 'other' }));
    await expect(service.update(existing.id, { name: 'Central Clinic' } as UpdateLocationDto))
      .rejects.toThrow(ConflictException);
    expect(locations.save).toHaveBeenCalledTimes(2);

    locations.findOne.mockResolvedValue(existing);
    const cleared = await service.update(existing.id, { companyId: null } as UpdateLocationDto);
    expect(cleared.companyId).toBeNull();
  });
});
