import { ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

type RepositoryMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const COMPANY_ID = '84f85f80-50cc-4b9e-8fb4-3c78b73d923d';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'c012345678901234567890123',
    name: 'North Farm',
    nameNormalized: 'north farm',
    phone: null,
    country: null,
    stateProvince: null,
    city: null,
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
    ...overrides,
  });
}

describe('LocationsService write operations', () => {
  let service: LocationsService;
  let locations: RepositoryMock;
  let companies: RepositoryMock;

  beforeEach(() => {
    locations = {
      findOne: jest.fn(),
      create: jest.fn((data) => Object.assign(new Location(), data)),
      save: jest.fn(async (location) => location),
    };
    companies = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new LocationsService(
      locations as unknown as Repository<Location>,
      companies as unknown as Repository<Company>,
    );
  });

  it('[AC-2]', async () => {
    const saved = makeLocation({ name: 'North Farm', nameNormalized: 'north farm' });
    locations.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(saved);
    locations.save.mockResolvedValue(saved);

    const result = await service.create({ name: '  North Farm  ' });

    expect(result.status).toBe(LocationStatus.ACTIVE);
    expect(result.companyId).toBeNull();
    expect(locations.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'North Farm', nameNormalized: 'north farm' }),
    );
  });

  it('[AC-3]', async () => {
    const missingName = validateSync(plainToInstance(CreateLocationDto, {}));
    const longName = validateSync(
      plainToInstance(CreateLocationDto, { name: 'x'.repeat(101) }),
    );
    expect(missingName.some((error) => error.property === 'name')).toBe(true);
    expect(longName.some((error) => error.property === 'name')).toBe(true);

    locations.findOne.mockResolvedValue(makeLocation());
    await expect(service.create({ name: 'NORTH FARM' })).rejects.toThrow(ConflictException);
    await expect(service.create({ name: 'North Farm' })).rejects.toThrow(
      'A Location with this name already exists.',
    );
  });

  it('[AC-4]', () => {
    const valid = validateSync(
      plainToInstance(CreateLocationDto, { name: 'North Farm', phone: '+61 (2) 1234-5678' }),
    );
    const invalid = validateSync(
      plainToInstance(CreateLocationDto, { name: 'North Farm', phone: 'call me' }),
    );
    expect(valid).toHaveLength(0);
    expect(invalid.some((error) => error.property === 'phone')).toBe(true);
  });

  it('[AC-5]', async () => {
    const company = Object.assign(new Company(), { id: COMPANY_ID, name: 'Acme' });
    const location = makeLocation({ companyId: COMPANY_ID, company });
    locations.findOne.mockImplementation(async (options: { where: { id?: string } }) =>
      options.where.id ? location : null,
    );
    locations.save.mockImplementation(async (entity) => entity);

    const detail = await service.findOne(location.id);
    expect(detail.company).toBe(company);

    await service.update(location.id, { city: 'Dubbo' });
    expect(locations.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ companyId: COMPANY_ID, city: 'Dubbo' }),
    );

    await service.update(location.id, { companyId: null });
    expect(locations.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ companyId: null }),
    );
    expect(locations.findOne).toHaveBeenCalledWith({
      where: { id: location.id },
      relations: { company: true },
    });
  });

  it('[AC-6]', async () => {
    const current = makeLocation();
    const other = makeLocation({ id: 'c112345678901234567890123', name: 'South Farm' });
    locations.findOne.mockImplementation(async (options: {
      where: { id?: string; nameNormalized?: string };
    }) => {
      if (options.where.nameNormalized === 'south farm') return other;
      if (options.where.id === current.id) return current;
      return null;
    });

    const unchanged = await service.update(current.id, { name: 'NORTH FARM' });
    expect(unchanged.name).toBe('NORTH FARM');
    expect(locations.findOne).not.toHaveBeenCalledWith({
      where: { nameNormalized: 'north farm' },
    });

    await expect(service.update(current.id, { name: 'South Farm' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('[AC-10]', async () => {
    const company = Object.assign(new Company(), { id: COMPANY_ID, name: 'Acme' });
    const savedLocations = new Map<string, Location>();
    companies.findOne.mockResolvedValue(company);
    let nextId = 0;
    locations.create.mockImplementation((data) =>
      Object.assign(new Location(), data, { id: `location-${++nextId}` }),
    );
    locations.findOne.mockImplementation(async (options: {
      where: { id?: string; nameNormalized?: string };
    }) => {
      if (options.where.id) return savedLocations.get(options.where.id) ?? null;
      return null;
    });
    locations.save.mockImplementation(async (entity) => {
      savedLocations.set(entity.id, entity);
      return entity;
    });

    const first = await service.create({ name: 'North Farm', companyId: COMPANY_ID });
    const second = await service.create({ name: 'South Farm', companyId: COMPANY_ID });
    const unassociated = await service.create({ name: 'West Farm' });

    expect(first.companyId).toBe(COMPANY_ID);
    expect(second.companyId).toBe(COMPANY_ID);
    expect(unassociated.companyId).toBeNull();
    expect(companies.findOne).toHaveBeenCalledTimes(2);
  });
});
