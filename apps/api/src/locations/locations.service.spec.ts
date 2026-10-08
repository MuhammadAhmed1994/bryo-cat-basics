import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

const ACTOR = '11111111-1111-4111-8111-111111111111';
const LOCATION_ID = '22222222-2222-4222-8222-222222222222';

type RepositoryMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: LOCATION_ID,
    name: 'North Clinic',
    nameNormalized: 'north clinic',
    phone: null,
    companyId: null,
    country: 'Australia',
    stateProvince: null,
    city: null,
    isActive: true,
    createdById: ACTOR,
    updatedById: ACTOR,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  }, overrides) as Location;
}

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepo: RepositoryMock;
  let companyRepo: RepositoryMock;
  let queryBuilder: Record<string, jest.Mock>;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    locationRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => Object.assign(new Location(), data)),
      save: jest.fn(async (location) => location),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    companyRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locationRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
      ],
    }).compile();
    service = moduleRef.get(LocationsService);
  });

  it('[AC-1] creates, retrieves, updates, activates and deactivates location records', async () => {
    locationRepo.findOne.mockResolvedValueOnce(null);
    const created = await service.create(
      { name: ' North Clinic ', country: 'Australia' },
      ACTOR,
    );
    expect(created).toMatchObject({
      name: 'North Clinic',
      nameNormalized: 'north clinic',
      isActive: true,
      createdById: ACTOR,
    });

    locationRepo.findOne.mockResolvedValueOnce(created);
    expect(await service.findOne(LOCATION_ID)).toBe(created);

    locationRepo.findOne
      .mockResolvedValueOnce(created)
      .mockResolvedValueOnce(null);
    const updated = await service.update(LOCATION_ID, { name: '  East Clinic ' }, ACTOR);
    expect(updated).toMatchObject({ name: 'East Clinic', nameNormalized: 'east clinic' });

    locationRepo.findOne.mockResolvedValueOnce(updated);
    expect(await service.setStatus(LOCATION_ID, false, ACTOR)).toMatchObject({
      isActive: false,
      updatedById: ACTOR,
    });
    locationRepo.findOne.mockResolvedValueOnce(updated);
    expect(await service.setStatus(LOCATION_ID, true, ACTOR)).toMatchObject({ isActive: true });
  });

  it('[AC-2] leaves locations accessible to signed-in users without adding role restrictions', () => {
    expect(Reflect.getMetadata('roles', LocationsController)).toBeUndefined();
    for (const handler of [
      LocationsController.prototype.create,
      LocationsController.prototype.list,
      LocationsController.prototype.findOne,
      LocationsController.prototype.update,
      LocationsController.prototype.setStatus,
      LocationsController.prototype.getCountries,
      LocationsController.prototype.getStates,
      LocationsController.prototype.getCities,
    ]) {
      expect(Reflect.getMetadata('roles', handler)).toBeUndefined();
    }
  });

  it('[AC-3] trims names and rejects case-insensitive duplicates across statuses', async () => {
    const inactive = makeLocation({ id: '44444444-4444-4444-8444-444444444444', isActive: false });
    locationRepo.findOne.mockResolvedValue(inactive);
    await expect(
      service.create({ name: '  NORTH CLINIC ', country: 'Australia' }, ACTOR),
    ).rejects.toThrow(ConflictException);
    expect(locationRepo.findOne).toHaveBeenCalledWith({
      where: { nameNormalized: 'north clinic' },
    });

    locationRepo.findOne.mockResolvedValueOnce(makeLocation());
    await expect(
      service.update(LOCATION_ID, { name: ' North Clinic ' }, ACTOR),
    ).rejects.toThrow(ConflictException);
  });

  it('[AC-4] validates company association, phone format and geographic hierarchy', async () => {
    companyRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create(
        {
          name: 'Clinic',
          companyId: '33333333-3333-4333-8333-333333333333',
          country: 'Australia',
        },
        ACTOR,
      ),
    ).rejects.toThrow(UnprocessableEntityException);

    await expect(
      service.create({ name: 'Clinic', phone: 'not-phone', country: 'Australia' }, ACTOR),
    ).rejects.toThrow('Enter a valid phone number.');

    await expect(
      service.create(
        {
          name: 'Clinic',
          country: 'Australia',
          stateProvince: 'Ontario',
          city: 'Toronto',
        },
        ACTOR,
      ),
    ).rejects.toThrow('Select a valid country, state/province, and city.');

    companyRepo.findOne.mockResolvedValue(Object.assign(new Company(), { id: 'company-id' }));
    locationRepo.findOne.mockResolvedValueOnce(null);
    const associated = await service.create(
      {
        name: 'Valid Clinic',
        companyId: '33333333-3333-4333-8333-333333333333',
        phone: '+1 (555) 123-4567',
        country: 'Canada',
        stateProvince: 'Ontario',
        city: 'Toronto',
      },
      ACTOR,
    );
    expect(associated).toMatchObject({ companyId: '33333333-3333-4333-8333-333333333333' });
  });

  it('[AC-10] defaults list to active name order and 50 rows with requested filters and pagination', async () => {
    const defaultResult = await service.findAll({});
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.isActive = :isActive', {
      isActive: true,
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
    expect(defaultResult).toEqual({ data: [], total: 0, page: 1, perPage: 50 });

    queryBuilder.andWhere.mockClear();
    await service.findAll({
      page: 2,
      perPage: 25,
      search: ' clinic ',
      status: 'INACTIVE',
      country: 'Canada',
      companyId: '33333333-3333-4333-8333-333333333333',
      sortDir: 'DESC',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.nameNormalized LIKE :search',
      { search: '%clinic%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.isActive = :isActive', {
      isActive: false,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.country = :country', {
      country: 'Canada',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.companyId = :companyId',
      { companyId: '33333333-3333-4333-8333-333333333333' },
    );
    expect(queryBuilder.orderBy).toHaveBeenLastCalledWith('location.name', 'DESC');
    expect(queryBuilder.skip).toHaveBeenLastCalledWith(25);
    expect(queryBuilder.take).toHaveBeenLastCalledWith(25);
  });
});
