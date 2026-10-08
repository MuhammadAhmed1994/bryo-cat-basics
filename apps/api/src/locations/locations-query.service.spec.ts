import { LocationsQueryService } from './locations-query.service';
import { ListLocationsDto } from './dto/list-locations.dto';
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
  let qb: QueryBuilderMock;
  let repository: { createQueryBuilder: jest.Mock };

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repository = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    service = new LocationsQueryService(repository as never);
  });

  it('[AC-13] trims search and matches partial names without regard to case', async () => {
    await service.findAll({ search: '  cEnTrAl  ' } as ListLocationsDto);

    expect(qb.andWhere).toHaveBeenCalledWith(
      'location.nameNormalized LIKE :search',
      { search: '%central%' },
    );
  });

  it('defaults to Active locations, name ascending, and 50 rows', async () => {
    const result = await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: LocationStatus.ACTIVE,
    });
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('location.company', 'company');
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
  });

  it('applies country, company, status, and pagination filters', async () => {
    const query: ListLocationsDto = {
      status: 'INACTIVE',
      country: 'Australia',
      companyId: '8f8f8f8f-aaaa-4aaa-8aaa-8f8f8f8f8f8f',
      page: 2,
      perPage: 25,
    };

    await service.findAll(query);

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: 'INACTIVE',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', {
      country: 'Australia',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'location.companyId = :companyId',
      { companyId: query.companyId },
    );
    expect(qb.skip).toHaveBeenCalledWith(25);
    expect(qb.take).toHaveBeenCalledWith(25);
  });

  it('does not constrain status when ALL is selected', async () => {
    await service.findAll({ status: 'ALL' });

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'location.status = :status',
      expect.anything(),
    );
  });
});
