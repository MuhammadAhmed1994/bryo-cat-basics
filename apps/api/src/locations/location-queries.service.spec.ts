import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationStatus } from './entities/location-status.enum';
import { LocationQueriesService } from './location-queries.service';

const LOCATION_ID = 'f73d3c42-6a7d-45f2-8f91-c72231685665';
const COMPANY_ID = '69cb925e-5664-468b-804d-93f3ea2abf69';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: LOCATION_ID,
    name: 'Auckland Office',
    nameNormalized: 'auckland office',
    companyId: COMPANY_ID,
    company: null,
    phone: null,
    contactPerson: null,
    contactPersonPhone: null,
    addressLine1: null,
    addressLine2: null,
    country: 'New Zealand',
    stateProvince: null,
    city: null,
    postalCode: null,
    status: LocationStatus.ACTIVE,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  }, overrides) as Location;
}

describe('LocationQueriesService', () => {
  let service: LocationQueriesService;
  let repo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
  };
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repo = {
      createQueryBuilder: jest.fn(() => qb),
      findOne: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationQueriesService,
        { provide: getRepositoryToken(Location), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(LocationQueriesService);
  });

  it('[AC-8] returns Active Locations by name with the default page size', async () => {
    const location = makeLocation();
    qb.getManyAndCount.mockResolvedValue([[location], 1]);

    const result = await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: LocationStatus.ACTIVE,
    });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(result).toEqual({ data: [location], total: 1, page: 1, perPage: 50 });
  });

  it('[AC-9] searches Location names partially without case or surrounding spaces', async () => {
    await service.findAll({ search: '  aUcKlAnD  ' });

    expect(qb.andWhere).toHaveBeenCalledWith('LOWER(location.name) LIKE :search', {
      search: '%auckland%',
    });
  });

  it('[AC-10] applies status, Country, and Company filters', async () => {
    await service.findAll({ status: LocationStatus.INACTIVE, country: '  Canada  ', companyId: COMPANY_ID });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: LocationStatus.INACTIVE,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', {
      country: 'Canada',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', {
      companyId: COMPANY_ID,
    });
  });

  it('loads an associated Company when retrieving a Location by id', async () => {
    const location = makeLocation();
    repo.findOne.mockResolvedValue(location);

    await expect(service.findOne(LOCATION_ID)).resolves.toBe(location);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: LOCATION_ID },
      relations: { company: true },
    });
  });

  it('returns 404 when a Location does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(LOCATION_ID)).rejects.toThrow(NotFoundException);
  });
});
