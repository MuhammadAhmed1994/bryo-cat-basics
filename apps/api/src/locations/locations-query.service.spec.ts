import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationsQueryService } from './locations-query.service';
import { Location, LocationStatus } from './entities/location.entity';

type LocationRepositoryMock = {
  createQueryBuilder: jest.Mock;
};

describe('LocationsQueryService', () => {
  let service: LocationsQueryService;
  let repository: LocationRepositoryMock;
  let queryBuilder: Record<string, jest.Mock>;

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
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsQueryService,
        { provide: getRepositoryToken(Location), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(LocationsQueryService);
  });

  it('[AC-13] trims search and matches partial names without regard to case', async () => {
    await service.findAll({ search: '  NoRtH  ' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(location.name) LIKE :search',
      { search: '%north%' },
    );
  });

  it('defaults to active locations ordered by name with 50 rows per page', async () => {
    const result = await service.findAll({});

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: 'ACTIVE',
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('location.company', 'company');
    expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
  });

  it('applies explicit status, country, and company filters', async () => {
    await service.findAll({
      status: LocationStatus.INACTIVE,
      country: 'Canada',
      companyId: '259d8dd9-8fca-4c0c-9ef7-1484b7624aa5',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: 'INACTIVE',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('location.country = :country', {
      country: 'Canada',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.companyId = :companyId',
      { companyId: '259d8dd9-8fca-4c0c-9ef7-1484b7624aa5' },
    );
  });
});
