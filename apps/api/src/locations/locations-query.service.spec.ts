import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationsQueryService } from './locations-query.service';

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

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const repository = { createQueryBuilder: jest.fn(() => qb) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsQueryService,
        { provide: getRepositoryToken(Location), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(LocationsQueryService);
  });

  it('[AC-8] matches partial location names regardless of search-term case', async () => {
    await service.findAll({ search: '  gEnEtIcS ' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'location.nameNormalized LIKE :search',
      { search: '%genetics%' },
    );
  });

  it('defaults to active locations, name ascending, and 50 records per page with Company loaded', async () => {
    const result = await service.findAll({});

    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('location.company', 'company');
    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: 'ACTIVE',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
  });

  it('applies status, stored country, Company ID and search filters together', async () => {
    await service.findAll({
      status: 'INACTIVE',
      country: 'Australia',
      companyId: 'a96cc7f3-6909-40d2-a310-008cadb30e20',
      search: '  port ',
    });

    expect(qb.andWhere).toHaveBeenNthCalledWith(1,
      'location.nameNormalized LIKE :search', { search: '%port%' });
    expect(qb.andWhere).toHaveBeenNthCalledWith(2,
      'location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenNthCalledWith(3,
      'location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenNthCalledWith(4,
      'location.companyId = :companyId', { companyId: 'a96cc7f3-6909-40d2-a310-008cadb30e20' });
  });
});
