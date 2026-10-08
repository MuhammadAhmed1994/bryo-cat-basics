import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { CreateLocationDto } from './dto/create-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

const ACTOR_ID = 'actor-uuid';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-uuid',
    name: 'North Clinic',
    nameNormalized: 'north clinic',
    phone: null,
    companyId: null,
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Sydney',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    createdById: ACTOR_ID,
    updatedById: ACTOR_ID,
  }, overrides);
}

describe('LocationsService', () => {
  let service: LocationsService;
  let locations: {
    create: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let companies: { findOne: jest.Mock };
  let queryBuilder: Record<string, jest.Mock>;

  beforeEach(() => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    locations = {
      create: jest.fn((input) => Object.assign(new Location(), input)),
      findOne: jest.fn(),
      save: jest.fn(async (location) => location),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    companies = { findOne: jest.fn() };
    service = new LocationsService(
      locations as unknown as Repository<Location>,
      companies as unknown as Repository<Company>,
    );
  });

  it('[AC-1] creates, reads, updates, activates, and deactivates a location', async () => {
    locations.findOne.mockResolvedValueOnce(null);
    const created = await service.create(
      { name: ' North Clinic ', country: 'Australia', stateProvince: 'New South Wales' },
      ACTOR_ID,
    );
    expect(created).toMatchObject({
      name: 'North Clinic', nameNormalized: 'north clinic', country: 'Australia', isActive: true,
    });
    expect(created.createdById).toBe(ACTOR_ID);

    const persisted = makeLocation();
    locations.findOne.mockResolvedValue(persisted);
    expect(await service.findOne(persisted.id)).toBe(persisted);
    const updated = await service.update(persisted.id, { name: ' East Clinic ' }, ACTOR_ID);
    expect(updated).toMatchObject({ name: 'East Clinic', nameNormalized: 'east clinic' });
    expect(updated.updatedById).toBe(ACTOR_ID);
    expect(await service.setStatus(persisted.id, false, ACTOR_ID)).toMatchObject({ isActive: false });
    expect(await service.setStatus(persisted.id, true, ACTOR_ID)).toMatchObject({ isActive: true });
  });

  it('[AC-2] location handlers remain protected by the global signed-in-user guard without role rules', () => {
    const handlers = [
      LocationsController.prototype.create,
      LocationsController.prototype.list,
      LocationsController.prototype.getCountries,
      LocationsController.prototype.getStates,
      LocationsController.prototype.getCities,
      LocationsController.prototype.setStatus,
      LocationsController.prototype.update,
      LocationsController.prototype.findOne,
    ];
    for (const handler of handlers) {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
    }
  });

  it('[AC-3] trims names and rejects case-insensitive name conflicts on create and update', async () => {
    locations.findOne.mockResolvedValueOnce(makeLocation({
      name: 'Existing', nameNormalized: 'existing', isActive: false,
    }));
    await expect(service.create(
      { name: ' EXISTING ', country: 'Australia' }, ACTOR_ID,
    )).rejects.toThrow(ConflictException);
    expect(locations.findOne).toHaveBeenCalledWith({ where: { nameNormalized: 'existing' } });

    locations.findOne.mockResolvedValueOnce(makeLocation());
    locations.findOne.mockResolvedValueOnce(makeLocation({ id: 'other-id', nameNormalized: 'east clinic' }));
    await expect(service.update('location-uuid', { name: ' East Clinic ' }, ACTOR_ID))
      .rejects.toThrow(ConflictException);
    expect(locations.findOne).toHaveBeenLastCalledWith({ where: { nameNormalized: 'east clinic' } });
  });

  it('[AC-4] validates company existence, phone format, and geographic parent-child relationships', async () => {
    locations.findOne.mockResolvedValue(null);
    await expect(service.create({
      name: 'Valid', companyId: 'not-found', country: 'Australia',
    }, ACTOR_ID)).rejects.toThrow(UnprocessableEntityException);
    companies.findOne.mockResolvedValue({ id: 'company-uuid' });

    await expect(service.create({
      name: 'Bad phone', phone: 'phone-number', country: 'Australia',
    }, ACTOR_ID)).rejects.toThrow('Enter a valid phone number.');
    await expect(service.create({
      name: 'Bad geography', country: 'Australia', stateProvince: 'Ontario',
    }, ACTOR_ID)).rejects.toThrow('Select a valid country, state/province, and city combination.');

    locations.findOne.mockResolvedValue(null);
    const valid: CreateLocationDto = {
      name: 'Valid', phone: '+1 (555) 123-4567', companyId: 'company-uuid',
      country: 'Canada', stateProvince: 'Ontario', city: 'Toronto',
    };
    const created = await service.create(valid, ACTOR_ID);
    expect(created).toMatchObject({ phone: '+1 (555) 123-4567', companyId: 'company-uuid' });

    const existing = makeLocation();
    locations.findOne.mockResolvedValue(existing);
    await expect(service.update(existing.id, {
      city: 'Toronto',
    } as UpdateLocationDto, ACTOR_ID)).rejects.toThrow(UnprocessableEntityException);
  });

  it('[AC-10] lists with Active, name ascending, 50-item defaults and supported filters', async () => {
    const defaultResult = await service.findAll({} as ListLocationsDto);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.isActive = :isActive', {
      isActive: true,
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(defaultResult).toEqual({ data: [], total: 0, page: 1, perPage: 50 });

    await service.findAll({
      page: 2, perPage: 25, status: 'INACTIVE', search: ' North ', country: 'Australia',
      companyId: 'company-uuid', sortDir: 'ASC',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', {
      search: '%north%',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.isActive = :isActive', {
      isActive: false,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(location.country) = LOWER(:country)', { country: 'Australia' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', {
      companyId: 'company-uuid',
    });
    expect(queryBuilder.take).toHaveBeenLastCalledWith(25);
    expect(queryBuilder.skip).toHaveBeenLastCalledWith(25);
  });
});
