import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
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
    id: 'location-id',
    name: 'North Clinic',
    nameNormalized: 'north clinic',
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
    id: 'company-id',
    name: 'Acme',
    isActive: true,
  }, overrides) as Company;
}

describe('LocationsService', () => {
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

  it('[AC-2] rejects case-insensitive duplicate names without creating a record', async () => {
    repo.findOne.mockResolvedValueOnce(makeLocation());

    await expect(service.create({ name: 'NORTH CLINIC' } as CreateLocationDto))
      .rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { nameNormalized: 'north clinic' },
    });
  });

  it('[AC-3] persists an active location with null company and supplied optional values', async () => {
    repo.findOne.mockResolvedValueOnce(null).mockImplementationOnce(async ({ where }) =>
      makeLocation({ id: where.id }),
    );

    const created = await service.create({
      name: '  South Office ',
      contactPersonName: 'Morgan Lee',
      contactPersonEmail: 'morgan@example.com',
      addressLine1: '10 Main Street',
      addressLine2: 'Suite 4',
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Sydney',
      postalCode: '2000',
    } as CreateLocationDto);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'South Office',
      nameNormalized: 'south office',
      status: LocationStatus.ACTIVE,
      companyId: null,
      contactPersonName: 'Morgan Lee',
      contactPersonEmail: 'morgan@example.com',
      addressLine1: '10 Main Street',
      addressLine2: 'Suite 4',
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Sydney',
      postalCode: '2000',
    }));
    expect(created).toBeInstanceOf(Location);
  });

  it('[AC-6] rejects invalid Location and Contact Person phones before saving', async () => {
    await expect(service.create({
      name: 'Phone Test',
      phone: 'not a phone',
    } as CreateLocationDto)).rejects.toThrow(BadRequestException);
    await expect(service.create({
      name: 'Phone Test',
      contactPersonPhone: 'bad!',
    } as CreateLocationDto)).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('[AC-10] offers active company values through the loaded association and clears it on update', async () => {
    const associated = makeLocation({ companyId: 'company-id', company: makeCompany() });
    repo.findOne
      .mockResolvedValueOnce(associated)
      .mockImplementationOnce(async ({ where }) => makeLocation({ id: where.id, companyId: null }));

    const updated = await service.update('location-id', { companyId: null });

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ companyId: null }));
    expect(updated.companyId).toBeNull();
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'location-id' },
      relations: { company: true },
    });
  });

  it('loads a location with its Company relation and reports missing IDs', async () => {
    const location = makeLocation({ company: makeCompany() });
    repo.findOne.mockResolvedValueOnce(location);
    await expect(service.findOne('location-id')).resolves.toBe(location);

    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('allows an update to keep its own name and rejects another record name', async () => {
    const existing = makeLocation();
    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
    await expect(service.update(existing.id, { name: 'North Clinic' })).resolves.toBeDefined();

    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(makeLocation({
      id: 'other-location',
      nameNormalized: 'south office',
    }));
    await expect(service.update(existing.id, { name: 'South Office' }))
      .rejects.toThrow(ConflictException);
  });
});
