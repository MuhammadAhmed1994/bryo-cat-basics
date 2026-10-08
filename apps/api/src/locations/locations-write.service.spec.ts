import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

type LocationRepositoryMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-1',
    name: 'North Farm',
    nameNormalized: 'north farm',
    phone: null,
    country: 'Australia',
    stateProvince: 'NSW',
    city: 'Dubbo',
    status: LocationStatus.ACTIVE,
    companyId: 'company-1',
    company: Object.assign({}, { id: 'company-1', name: 'Acme' }),
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  }, overrides) as Location;
}

describe('LocationsService write operations', () => {
  let service: LocationsService;
  let repo: LocationRepositoryMock;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((values) => Object.assign(new Location(), values)),
      save: jest.fn(async (location) => location),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('[AC-2] creates Active locations with the selected or null company association', async () => {
    repo.findOne.mockResolvedValue(null);

    const associated = await service.create({ name: 'North Farm', companyId: 'company-1' });
    const unassociated = await service.create({ name: 'South Farm' });

    expect(associated.status).toBe(LocationStatus.ACTIVE);
    expect(associated.companyId).toBe('company-1');
    expect(unassociated.status).toBe(LocationStatus.ACTIVE);
    expect(unassociated.companyId).toBeNull();
    expect(associated.nameNormalized).toBe('north farm');
  });

  it('[AC-3] rejects missing, overlong, and case-insensitive duplicate names with a name conflict', async () => {
    const missingName = plainToInstance(CreateLocationDto, {});
    const longName = plainToInstance(CreateLocationDto, { name: 'x'.repeat(101) });
    expect(await validate(missingName)).not.toHaveLength(0);
    expect(await validate(longName)).not.toHaveLength(0);

    repo.findOne.mockResolvedValue(makeLocation());
    await expect(service.create({ name: 'NORTH FARM' })).rejects.toMatchObject({
      response: { field: 'name' },
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { nameNormalized: 'north farm' },
    });
  });

  it('[AC-4] accepts Company-format phone values and rejects invalid supplied phone values', async () => {
    const valid = plainToInstance(CreateLocationDto, {
      name: 'Farm',
      phone: '+61 (400) 123-456',
    });
    const invalid = plainToInstance(CreateLocationDto, {
      name: 'Farm',
      phone: 'not a phone',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('[AC-5] returns saved fields and Company association, retaining omitted and clearing null association', async () => {
    const saved = makeLocation();
    repo.findOne.mockResolvedValue(saved);

    const detail = { ...(await service.findOne(saved.id)) };
    const retained = await service.update(saved.id, { city: 'Orange' });

    expect(detail).toMatchObject({
      name: 'North Farm',
      phone: null,
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Dubbo',
      status: LocationStatus.ACTIVE,
      companyId: 'company-1',
      company: { id: 'company-1' },
    });
    expect(retained.companyId).toBe('company-1');
    expect(retained.city).toBe('Orange');

    const cleared = await service.update(saved.id, { companyId: null });
    expect(cleared.companyId).toBeNull();
  });

  it('[AC-6] permits an unchanged name and rejects a case-insensitive match to another Location', async () => {
    const current = makeLocation();
    const duplicate = makeLocation({
      id: 'location-2',
      name: 'South Farm',
      nameNormalized: 'south farm',
    });
    repo.findOne.mockImplementation(async (options: { where: { id?: string; nameNormalized?: string } }) => {
      if (options.where.id === current.id) return current;
      if (options.where.nameNormalized === 'north farm') return current;
      if (options.where.nameNormalized === 'south farm') return duplicate;
      return null;
    });

    await expect(service.update(current.id, { name: 'North Farm' })).resolves.toMatchObject({
      name: 'North Farm',
    });
    await expect(service.update(current.id, { name: 'SOUTH FARM' })).rejects.toMatchObject({
      response: { field: 'name' },
    });
  });

  it('[AC-10] associates multiple Locations with one Company while allowing unassociated Locations', async () => {
    repo.findOne.mockResolvedValue(null);

    const first = await service.create({ name: 'North Farm', companyId: 'company-1' });
    const second = await service.create({ name: 'South Farm', companyId: 'company-1' });
    const standalone = await service.create({ name: 'West Farm', companyId: null });

    expect(first.companyId).toBe('company-1');
    expect(second.companyId).toBe('company-1');
    expect(standalone.companyId).toBeNull();
  });
});
