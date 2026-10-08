import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { LocationsController } from './locations.controller';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationStatus } from './entities/location-status.enum';
import { LocationsService } from './locations.service';

type RepositoryMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const ACTOR_ID = 'actor-id';
const LOCATION_ID = 'location-id';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: LOCATION_ID,
    name: 'Main Clinic',
    nameNormalized: 'main clinic',
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
  }) as Location;
}

describe('LocationsService', () => {
  let service: LocationsService;
  let controller: LocationsController;
  let locations: RepositoryMock;
  let companies: RepositoryMock;

  beforeEach(async () => {
    locations = {
      findOne: jest.fn(),
      create: jest.fn((values: Partial<Location>) => Object.assign(new Location(), values)),
      save: jest.fn(async (location: Location) =>
        Object.assign(location, { id: location.id ?? LOCATION_ID }),
      ),
    };
    companies = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locations },
        { provide: getRepositoryToken(Company), useValue: companies },
      ],
    }).compile();
    service = moduleRef.get(LocationsService);
    controller = moduleRef.get(LocationsController);
  });

  it('[AC-2] creates an Active Location without Company and returns list navigation and success feedback', async () => {
    locations.findOne.mockResolvedValue(null);
    const dto = { name: '  Main Clinic  ' } as CreateLocationDto;

    const response = await controller.create(dto, { id: ACTOR_ID } as never);

    expect(response.name).toBe('Main Clinic');
    expect(response.status).toBe(LocationStatus.ACTIVE);
    expect(response.companyId).toBeNull();
    expect(response.message).toBe('Location added successfully.');
    expect(response.redirectTo).toBe('/locations');
    expect(locations.save).toHaveBeenCalledTimes(1);
  });

  it('[AC-3] rejects invalid names, duplicate names, phones, geography, and Companies before saving', async () => {
    const missingNameErrors = await validate(plainToInstance(CreateLocationDto, {}));
    const overLimitNameErrors = await validate(plainToInstance(CreateLocationDto, {
      name: 'x'.repeat(101),
    }));
    expect(missingNameErrors.some((error) => error.property === 'name')).toBe(true);
    expect(overLimitNameErrors.some((error) => error.property === 'name')).toBe(true);

    locations.findOne.mockResolvedValue(makeLocation());
    await expect(service.create({ name: 'MAIN CLINIC' } as CreateLocationDto, ACTOR_ID))
      .rejects.toThrow(ConflictException);

    locations.findOne.mockResolvedValue(null);
    await expect(service.create(
      { name: 'Another Clinic', phone: '555-CALL' } as CreateLocationDto,
      ACTOR_ID,
    )).rejects.toThrow(BadRequestException);
    await expect(service.create(
      { name: 'Another Clinic', stateProvince: 'NSW' } as CreateLocationDto,
      ACTOR_ID,
    )).rejects.toThrow(BadRequestException);
    await expect(service.create(
      { name: 'Another Clinic', country: 'Australia', city: 'Sydney' } as CreateLocationDto,
      ACTOR_ID,
    )).rejects.toThrow(BadRequestException);
    companies.findOne.mockResolvedValue(null);
    await expect(service.create(
      { name: 'Another Clinic', companyId: 'b6e5b2f7-0e48-4479-a85d-0ecc9fce19c2' } as CreateLocationDto,
      ACTOR_ID,
    )).rejects.toThrow(BadRequestException);
    expect(locations.save).not.toHaveBeenCalled();
  });

  it('[AC-6] keeps, changes, or clears Company and excludes its own name from duplicate checks', async () => {
    const existing = makeLocation({ companyId: 'company-a' });
    locations.findOne.mockResolvedValue(existing);
    const activeCompany = Object.assign(new Company(), { id: 'company-b', isActive: true });
    companies.findOne.mockResolvedValue(activeCompany);

    await service.update(LOCATION_ID, { name: 'Main Clinic' } as UpdateLocationDto, ACTOR_ID);
    expect(existing.name).toBe('Main Clinic');
    expect(existing.companyId).toBe('company-a');

    await service.update(LOCATION_ID, { companyId: 'company-b' } as UpdateLocationDto, ACTOR_ID);
    expect(existing.companyId).toBe('company-b');
    await service.update(LOCATION_ID, { companyId: null } as UpdateLocationDto, ACTOR_ID);
    expect(existing.companyId).toBeNull();

    locations.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(
      makeLocation({ id: 'other-location', name: 'Other', nameNormalized: 'other' }),
    );
    const savesBeforeDuplicate = locations.save.mock.calls.length;
    await expect(service.update(
      LOCATION_ID,
      { name: 'Other' } as UpdateLocationDto,
      ACTOR_ID,
    )).rejects.toThrow(ConflictException);
    expect(locations.save).toHaveBeenCalledTimes(savesBeforeDuplicate);
  });
});
