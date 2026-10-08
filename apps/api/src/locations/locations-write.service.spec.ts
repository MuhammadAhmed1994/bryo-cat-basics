import { ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

type LocationRepositoryMock = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'c-location-1',
    name: 'North Farm',
    nameNormalized: 'north farm',
    phone: null,
    country: 'Australia',
    stateProvince: 'NSW',
    city: 'Dubbo',
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
    ...overrides,
  });
}

describe('LocationsService write operations', () => {
  let service: LocationsService;
  let repo: LocationRepositoryMock;

  beforeEach(async () => {
    repo = {
      create: jest.fn((values: Partial<Location>) => Object.assign(new Location(), values)),
      save: jest.fn(async (location: Location) => location),
      findOne: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(LocationsService);
  });

  it('[AC-2]', async () => {
    const saved = makeLocation({ id: 'c-new-location', companyId: 'c-selected-company' });
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(saved);
    repo.save.mockResolvedValueOnce(saved);

    const result = await service.create({
      name: '  North Farm ',
      phone: '+61 (2) 9876-5432',
      companyId: 'c-selected-company',
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'North Farm',
      nameNormalized: 'north farm',
      status: LocationStatus.ACTIVE,
      companyId: 'c-selected-company',
    }));
    expect(result.status).toBe(LocationStatus.ACTIVE);
    expect(result.companyId).toBe('c-selected-company');

    repo.findOne.mockReset().mockResolvedValueOnce(null).mockResolvedValueOnce(
      makeLocation({ id: 'c-unassigned', companyId: null }),
    );
    repo.save.mockResolvedValueOnce(makeLocation({ id: 'c-unassigned', companyId: null }));
    const unassigned = await service.create({ name: 'Unassigned Farm' });
    expect(unassigned.companyId).toBeNull();
  });

  it('[AC-3]', async () => {
    const invalidMissing = plainToInstance(CreateLocationDto, {});
    const invalidLong = plainToInstance(CreateLocationDto, { name: 'x'.repeat(101) });
    expect((await validate(invalidMissing)).some((error) => error.property === 'name')).toBe(true);
    expect((await validate(invalidLong)).some((error) => error.property === 'name')).toBe(true);

    repo.findOne.mockResolvedValueOnce({ id: 'c-existing', name: 'North Farm' });
    let response: unknown;
    try {
      await service.create({ name: 'NORTH FARM' });
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      response = (error as ConflictException).getResponse();
    }
    expect(response).toMatchObject({ field: 'name', code: 'LOCATION_NAME_CONFLICT' });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('[AC-4]', async () => {
    const valid = plainToInstance(CreateLocationDto, {
      name: 'Farm',
      phone: '+61 (2) 9876-5432',
    });
    const invalid = plainToInstance(UpdateLocationDto, { phone: 'phone?' });
    expect(await validate(valid)).toHaveLength(0);
    expect((await validate(invalid)).some((error) => error.property === 'phone')).toBe(true);
  });

  it('[AC-5]', async () => {
    const company = Object.assign(new Company(), { id: 'c-company-1', name: 'Example Co' });
    const current = makeLocation({ companyId: company.id, company });
    repo.findOne.mockResolvedValue(current);

    const detail = await service.findOne(current.id);
    expect(detail).toMatchObject({
      name: 'North Farm',
      phone: null,
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Dubbo',
      status: LocationStatus.ACTIVE,
      companyId: company.id,
      company: { id: company.id, name: 'Example Co' },
    });

    await service.update(current.id, {});
    expect(current.companyId).toBe(company.id);
    await service.update(current.id, { companyId: null });
    expect(current.companyId).toBeNull();
  });

  it('[AC-6]', async () => {
    const current = makeLocation();
    repo.findOne.mockImplementation(async (options: { where: { id?: string; nameNormalized?: string } }) => {
      if (options.where.nameNormalized) return current;
      return current;
    });
    const unchanged = await service.update(current.id, { name: 'North Farm' });
    expect(unchanged.name).toBe('North Farm');

    const other = makeLocation({ id: 'c-location-2', name: 'South Farm' });
    repo.findOne.mockImplementation(async (options: { where: { id?: string; nameNormalized?: string } }) =>
      options.where.nameNormalized ? other : current,
    );
    await expect(service.update(current.id, { name: 'SOUTH FARM' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('[AC-10]', async () => {
    const companyId = 'c-shared-company';
    const first = makeLocation({ id: 'c-location-one', companyId });
    const second = makeLocation({ id: 'c-location-two', name: 'Another Farm', companyId });
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(second);
    repo.save.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const one = await service.create({ name: 'North Farm', companyId });
    const two = await service.create({ name: 'Another Farm', companyId });

    expect(one.companyId).toBe(companyId);
    expect(two.companyId).toBe(companyId);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });
});
