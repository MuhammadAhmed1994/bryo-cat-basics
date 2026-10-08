import { Repository } from 'typeorm';
import { LocationsQueryService } from './locations-query.service';
import { Location, LocationStatus } from './entities/location.entity';

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

describe('LocationsQueryService', () => {
  let service: LocationsQueryService;
  let queryBuilder: QueryBuilderMock;
  let createQueryBuilder: jest.Mock;

  beforeEach(() => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    service = new LocationsQueryService({
      createQueryBuilder,
    } as unknown as Repository<Location>);
  });

  it('[AC-8] matches partial Location names without regard to search-term case', async () => {
    await service.findAll({ search: '  NoRtH  ' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.nameNormalized LIKE :search',
      { search: '%north%' },
    );
  });

  it('defaults to active Locations, name ascending, and 50 records per page', async () => {
    await service.findAll({});

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.status = :status',
      { status: LocationStatus.ACTIVE },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'location.company',
      'company',
    );
  });

  it('combines status, country, Company, and search filters', async () => {
    await service.findAll({
      status: LocationStatus.INACTIVE,
      country: 'Australia',
      companyId: 'c-company-id',
      search: 'farm',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.status = :status',
      { status: LocationStatus.INACTIVE },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.country = :country',
      { country: 'Australia' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.companyId = :companyId',
      { companyId: 'c-company-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.nameNormalized LIKE :search',
      { search: '%farm%' },
    );
  });

  it('returns matching records and pagination metadata', async () => {
    const location = Object.assign(new Location(), {
      id: 'c-location-id',
      name: 'North Farm',
      company: null,
    });
    queryBuilder.getManyAndCount.mockResolvedValue([[location], 11]);

    const result = await service.findAll({ page: 2, perPage: 25 });

    expect(result).toEqual({ data: [location], total: 11, page: 2, perPage: 25 });
    expect(queryBuilder.skip).toHaveBeenCalledWith(25);
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
  });
});
