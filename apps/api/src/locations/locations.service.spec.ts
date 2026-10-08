import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompaniesService } from '../companies/companies.service';
import { Company } from '../companies/entities/company.entity';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

type LocationRepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-uuid',
    name: 'North Farm',
    nameNormalized: 'north farm',
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
    description: null,
    phone: null,
    contactPersonName: null,
    contactPersonPhone: null,
    contactPersonEmail: null,
    addressLine1: null,
    addressLine2: null,
    country: null,
    stateProvince: null,
    city: null,
    postalCode: null,
  }, overrides) as Location;
}

describe('LocationsService', () => {
  let service: LocationsService;
  let repo: LocationRepoMock;

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

  it('[AC-2] rejects case-insensitive duplicate names without saving', async () => {
    repo.findOne.mockResolvedValue(makeLocation());

    await expect(service.create({ name: 'NORTH FARM' })).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { nameNormalized: 'north farm' },
    });
  });

  it('[AC-3] creates an Active location with null Company by default and persists optional values', async () => {
    const created = makeLocation({
      description: 'Distribution site',
      phone: '+1 (212) 555-0100',
      contactPersonName: 'A. Manager',
      contactPersonPhone: '+1 212 555 0101',
      contactPersonEmail: 'manager@example.com',
      addressLine1: '10 Main Street',
      addressLine2: 'Unit 4',
      country: 'United States',
      stateProvince: 'New York',
      city: 'New York',
      postalCode: '10001',
    });
    repo.findOne.mockImplementation(async ({ where }) =>
      where.nameNormalized ? null : created,
    );
    repo.save.mockImplementation(async (location) => Object.assign(location, { id: created.id }));

    const result = await service.create({
      name: 'North Farm',
      status: LocationStatus.INACTIVE,
      description: 'Distribution site',
      phone: '+1 (212) 555-0100',
      contactPersonName: 'A. Manager',
      contactPersonPhone: '+1 212 555 0101',
      contactPersonEmail: 'manager@example.com',
      addressLine1: '10 Main Street',
      addressLine2: 'Unit 4',
      country: 'United States',
      stateProvince: 'New York',
      city: 'New York',
      postalCode: '10001',
    });

    expect(result.status).toBe(LocationStatus.ACTIVE);
    expect(result.companyId).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: LocationStatus.ACTIVE,
      companyId: null,
      contactPersonEmail: 'manager@example.com',
      addressLine1: '10 Main Street',
      city: 'New York',
      postalCode: '10001',
    }));
  });

  it('[AC-6] rejects invalid Location and Contact Person phones before persistence with field feedback', async () => {
    await expect(service.create({ name: 'North Farm', phone: '------' }))
      .rejects.toMatchObject({
        response: { errors: { phone: 'Enter a valid phone number.' } },
      });
    await expect(service.create({ name: 'North Farm', contactPersonPhone: 'not a phone' }))
      .rejects.toMatchObject({
        response: { errors: { contactPersonPhone: 'Enter a valid phone number.' } },
      });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('[AC-10] exposes only active Company choices and clears the Company association on update', async () => {
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const companyRepo = {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<Company>;
    await new CompaniesService(companyRepo).findAll({});
    expect(qb.andWhere).toHaveBeenCalledWith('company.isActive = :isActive', {
      isActive: true,
    });

    const existing = makeLocation({ companyId: 'company-uuid', company: new Company() });
    repo.findOne.mockImplementation(async ({ where }) =>
      where.nameNormalized ? null : existing,
    );
    repo.save.mockImplementation(async (location) => location);

    const result = await service.update(existing.id, { companyId: null });

    expect(result.companyId).toBeNull();
    expect(result.company).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ companyId: null }));
  });

  it('returns not found for an unknown Location id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
