import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationsQueryService } from './locations-query.service';
import { Location, LocationStatus } from './entities/location.entity';

type QueryBuilderMock = Record<string, jest.Mock>;

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'c012345678901234567890123',
    name: 'Silver Creek',
    nameNormalized: 'silver creek',
    phone: null,
    country: 'Australia',
    stateProvince: null,
    city: null,
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  }, overrides);
}

describe('LocationsQueryService', () => {
  let service: LocationsQueryService;
  let repository: { createQueryBuilder: jest.Mock };
  let queryBuilder: QueryBuilderMock;

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsQueryService,
        { provide: getRepositoryToken(Location), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(LocationsQueryService);
  });

  it('[AC-8] partial-name searches match regardless of search-term letter case', async () => {
    const match = makeLocation();
    queryBuilder.getManyAndCount.mockResolvedValue([[match], 1]);

    const lowerCaseResult = await service.findAll({ search: 'silVER' });
    const upperCaseResult = await service.findAll({ search: 'SILVER' });

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'location.nameNormalized LIKE :search',
      { search: '%silver%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      3,
      'location.nameNormalized LIKE :search',
      { search: '%silver%' },
    );
    expect(lowerCaseResult.data).toEqual([match]);
    expect(upperCaseResult.data).toEqual([match]);
  });

  it('defaults to active, name-ascending results with 50 records per page and Company joined', async () => {
    const result = await service.findAll({});

    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'location.company',
      'company',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: LocationStatus.ACTIVE,
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
    expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
  });

  it('combines explicit status, stored country and Company filters with search criteria', async () => {
    await service.findAll({
      search: 'Farm',
      status: LocationStatus.INACTIVE,
      country: 'Australia',
      companyId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'location.nameNormalized LIKE :search',
      { search: '%farm%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'location.status = :status',
      { status: LocationStatus.INACTIVE },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      3,
      'location.country = :country',
      { country: 'Australia' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      4,
      'location.companyId = :companyId',
      { companyId: '123e4567-e89b-12d3-a456-426614174000' },
    );
  });
});
