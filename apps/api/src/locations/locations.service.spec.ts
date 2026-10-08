import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService } from './locations.service';

type LocationRepositoryMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const LOCATION_ID = 'b6e342e8-5819-48ed-9c5c-a77cfc935208';
const COMPANY_ID = '0cc62d12-afb5-4414-ae06-42a585cf94f0';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: LOCATION_ID,
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

describe('LocationsService', () => {
  let service: LocationsService;
  let repo: LocationRepositoryMock;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((values) => Object.assign(new Location(), values)),
      save: jest.fn(async (location: Location) => location),
    };
    repo.findOne.mockImplementation(async (options: { where: { id?: string; nameNormalized?: string } }) => {
      if (options.where.nameNormalized) return null;
      return makeLocation({ id: options.where.id });
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(LocationsService);
  });

  it('[AC-2] rejects names that duplicate another Location regardless of case', async () => {
    repo.findOne.mockResolvedValueOnce(
      makeLocation({ name: 'North Clinic', nameNormalized: 'north clinic' }),
    );

    await expect(service.create({ name: ' NORTH CLINIC ' })).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('[AC-3] creates Active with null Company by default and persists supplied optional values', async () => {
    const created = await service.create({
      name: '  Lakeside  ',
      status: LocationStatus.INACTIVE,
      description: 'Main office',
      phone: '+1 (555) 123-4567',
      contactPersonName: 'Morgan Lee',
      contactPersonPhone: '555-222-3333',
      contactPersonEmail: 'morgan@example.com',
      addressLine1: '12 Lake Road',
      addressLine2: 'Suite 4',
      country: 'Canada',
      stateProvince: 'Ontario',
      city: 'Toronto',
      postalCode: 'M5V 2T6',
    });

    expect(created.status).toBe(LocationStatus.ACTIVE);
    expect(created.companyId).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Lakeside',
      nameNormalized: 'lakeside',
      description: 'Main office',
      contactPersonName: 'Morgan Lee',
      contactPersonEmail: 'morgan@example.com',
      addressLine1: '12 Lake Road',
      addressLine2: 'Suite 4',
      country: 'Canada',
      stateProvince: 'Ontario',
      city: 'Toronto',
      postalCode: 'M5V 2T6',
    }));
  });

  it('[AC-6] rejects invalid Location and Contact Person phones before persistence', async () => {
    await expect(service.create({ name: 'Bad Location Phone', phone: '------' }))
      .rejects.toThrow('Enter a valid phone number.');
    await expect(service.create({ name: 'Bad Contact Phone', contactPersonPhone: '() --- ' }))
      .rejects.toThrow('Enter a valid phone number.');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('[AC-10] returns an active Company relation and clears that association on update', async () => {
    const activeCompany = Object.assign(new Company(), {
      id: COMPANY_ID,
      name: 'Active Company',
      isActive: true,
    });
    const existing = makeLocation({ companyId: COMPANY_ID, company: activeCompany });
    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

    const loaded = await service.findOne(LOCATION_ID);
    expect(loaded.company?.isActive).toBe(true);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: LOCATION_ID },
      relations: { company: true },
    });

    const updated = await service.update(LOCATION_ID, { companyId: null });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ companyId: null }));
    expect(updated.companyId).toBeNull();
  });
});
