import { plainToInstance } from 'class-transformer';
import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

type RepositoryMock<T> = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-uuid',
    name: 'North Farm',
    nameNormalized: 'north farm',
    description: null,
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
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

function makeCompany(overrides: Partial<Company> = {}): Company {
  return Object.assign(new Company(), {
    id: 'company-uuid',
    name: 'Acme',
    nameNormalized: 'acme',
    isActive: true,
  }, overrides) as Company;
}

describe('LocationsService', () => {
  let service: LocationsService;
  let locations: RepositoryMock<Location>;
  let companies: RepositoryMock<Company>;

  beforeEach(async () => {
    locations = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((values) => Object.assign(new Location(), values)),
      save: jest.fn(async (location) => Object.assign(location, { id: location.id ?? 'location-uuid' })),
    };
    companies = {
      findOne: jest.fn().mockResolvedValue(null),
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

  it('[AC-2] rejects case-insensitive duplicate Location names', async () => {
    locations.findOne.mockResolvedValue(makeLocation());

    await expect(service.create({ name: 'NORTH FARM' })).rejects.toThrow(ConflictException);
    expect(locations.save).not.toHaveBeenCalled();
  });

  it('[AC-3] creates an Active Location with null Company and persists optional details', async () => {
    locations.findOne.mockResolvedValue(null);
    const data: CreateLocationDto = {
      name: '  South Farm  ',
      contactPersonName: 'Taylor Smith',
      contactPersonEmail: 'taylor@example.com',
      addressLine1: '1 Farm Road',
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Dubbo',
      postalCode: '2830',
    };

    const created = await service.create(data);

    expect(created.status).toBe(LocationStatus.ACTIVE);
    expect(created.companyId).toBeNull();
    expect(created.name).toBe('South Farm');
    expect(created.contactPersonName).toBe('Taylor Smith');
    expect(created.contactPersonEmail).toBe('taylor@example.com');
    expect(created.addressLine1).toBe('1 Farm Road');
    expect(created.country).toBe('Australia');
    expect(created.stateProvince).toBe('NSW');
    expect(created.city).toBe('Dubbo');
    expect(created.postalCode).toBe('2830');

    const company = makeCompany();
    companies.findOne.mockResolvedValue(company);
    const withCompany = await service.create({ name: 'West Farm', companyId: company.id });
    expect(withCompany.companyId).toBe(company.id);
    expect(withCompany.company).toBe(company);
    expect(locations.save).toHaveBeenCalledTimes(2);
  });

  it('[AC-6] rejects invalid Location and Contact Person phones before saving with field feedback', async () => {
    locations.findOne.mockResolvedValue(null);

    const invalidLocationPhone = plainToInstance(CreateLocationDto, {
      name: 'Bad Location Phone', phone: '------',
    });
    const locationPhoneErrors = await validate(invalidLocationPhone);
    expect(locationPhoneErrors.some((error) => error.property === 'phone')).toBe(true);
    await expect(service.create(invalidLocationPhone)).rejects.toThrow('Enter a valid phone number.');

    const invalidContactPhone = plainToInstance(CreateLocationDto, {
      name: 'Bad Contact Phone', contactPersonPhone: '------',
    });
    const contactPhoneErrors = await validate(invalidContactPhone);
    expect(contactPhoneErrors.some((error) => error.property === 'contactPersonPhone')).toBe(true);
    await expect(service.create(invalidContactPhone)).rejects.toThrow('Enter a valid phone number.');
    expect(locations.save).not.toHaveBeenCalled();
  });

  it('[AC-10] associates an active Company and clears the association when companyId is null', async () => {
    const activeCompany = makeCompany({ isActive: true });
    const original = makeLocation();
    companies.findOne.mockResolvedValue(activeCompany);
    locations.findOne
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(makeLocation({ companyId: activeCompany.id, company: activeCompany }))
      .mockResolvedValueOnce(makeLocation({ companyId: activeCompany.id, company: activeCompany }))
      .mockResolvedValueOnce(makeLocation());
    locations.save.mockImplementation(async (location) => location);

    const associated = await service.update(original.id, { companyId: activeCompany.id });
    expect(associated.companyId).toBe(activeCompany.id);
    expect(associated.company).toBe(activeCompany);
    expect(companies.findOne).toHaveBeenCalledWith({ where: { id: activeCompany.id } });

    const cleared = await service.update(original.id, { companyId: null });
    expect(cleared.companyId).toBeNull();
    expect(cleared.company).toBeNull();
    expect(locations.save).toHaveBeenLastCalledWith(expect.objectContaining({ companyId: null }));
  });
});
