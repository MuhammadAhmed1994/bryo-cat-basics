import { ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-1',
    name: 'North Office',
    phone: null,
    contactPersonPhone: null,
    country: 'Canada',
    stateProvince: null,
    city: null,
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
  }, overrides);
}

function makeCompany(overrides: Partial<Company> = {}): Company {
  return Object.assign(new Company(), { id: 'company-1', name: 'Acme', isActive: true }, overrides);
}

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepo: Record<string, jest.Mock>;
  let companyRepo: Record<string, jest.Mock>;
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    locationRepo = {
      create: jest.fn((input) => Object.assign(new Location(), input)),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => qb),
    };
    companyRepo = { findOne: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locationRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
      ],
    }).compile();
    service = moduleRef.get(LocationsService);
  });

  it('[AC-1] creates a Location as Active and returns the saved record', async () => {
    const created = await service.create({ name: '  North Office  ' });

    expect(created.name).toBe('North Office');
    expect(created.status).toBe(LocationStatus.ACTIVE);
    expect(created.companyId).toBeNull();
    expect(locationRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: LocationStatus.ACTIVE }));
  });

  it('[AC-2] requires a valid unique name and rejects a case-insensitive duplicate', async () => {
    const missingName = plainToInstance(CreateLocationDto, {});
    const tooLong = plainToInstance(CreateLocationDto, { name: 'x'.repeat(101) });
    expect(validateSync(missingName).length).toBeGreaterThan(0);
    expect(validateSync(tooLong).length).toBeGreaterThan(0);

    qb.getOne.mockResolvedValue(makeLocation({ name: 'NORTH OFFICE' }));
    await expect(service.create({ name: 'North Office' })).rejects.toThrow(ConflictException);
    expect(qb.where).toHaveBeenCalledWith('LOWER(location.name) = LOWER(:name)', { name: 'North Office' });

    qb.getOne.mockResolvedValue(null);
    const accepted = await service.create({ name: 'x'.repeat(100) });
    expect(accepted.name).toHaveLength(100);
  });

  it('[AC-3] validates phone and contact-person phone values on create and update DTOs', () => {
    const valid = plainToInstance(CreateLocationDto, {
      name: 'Office',
      phone: '+1 (555) 123-4567',
      contactPersonPhone: '555-765-4321',
    });
    const invalidCreate = plainToInstance(CreateLocationDto, { name: 'Office', phone: 'telephone' });
    const invalidUpdate = plainToInstance(UpdateLocationDto, { contactPersonPhone: 'bad' });

    expect(validateSync(valid)).toHaveLength(0);
    expect(validateSync(invalidCreate).length).toBeGreaterThan(0);
    expect(validateSync(invalidUpdate).length).toBeGreaterThan(0);
  });

  it('[AC-6] defaults to Active name-ascending pages of 50 and projects the Company label', async () => {
    qb.getManyAndCount.mockResolvedValue([
      [makeLocation({ company: makeCompany(), companyId: 'company-1' }), makeLocation({ id: '2', name: 'South Office' })],
      2,
    ]);
    const result = await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(result.perPage).toBe(50);
    expect(result.data.map((row) => row.company)).toEqual(['Acme', '-']);
    expect(result.data.map((row) => row.status)).toEqual([LocationStatus.ACTIVE, LocationStatus.ACTIVE]);
  });

  it('[AC-9] applies status, country, and company filters to the list query', async () => {
    await service.findAll({ status: 'INACTIVE', country: 'Canada', companyId: 'company-2' });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Canada' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', { companyId: 'company-2' });
  });

  it('[AC-10] associates only active Companies and returns the Company on create and update', async () => {
    const company = makeCompany();
    companyRepo.findOne.mockResolvedValue(company);
    const created = await service.create({ name: 'North Office', companyId: company.id });
    expect(created.company).toBe(company);
    expect(created.companyId).toBe(company.id);

    locationRepo.findOne.mockResolvedValue(makeLocation());
    const updated = await service.update('location-1', { companyId: company.id });
    expect(updated.company).toBe(company);
    expect(companyRepo.findOne).toHaveBeenCalledWith({ where: { id: company.id, isActive: true } });
  });

  it('[AC-11] creates without a Company and clears an existing association with null', async () => {
    const created = await service.create({ name: 'North Office' });
    expect(created.companyId).toBeNull();
    expect(created.company).toBeNull();

    locationRepo.findOne.mockResolvedValue(makeLocation({ company: makeCompany(), companyId: 'company-1' }));
    const cleared = await service.update('location-1', { companyId: null });
    expect(cleared.companyId).toBeNull();
    expect(cleared.company).toBeNull();
    expect(locationRepo.save).toHaveBeenLastCalledWith(expect.objectContaining({ companyId: null }));
  });
});
