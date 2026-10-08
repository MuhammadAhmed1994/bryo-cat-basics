import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location } from './entities/location.entity';
import { LocationStatus } from './entities/location-status.enum';
import { LocationQueriesService } from './location-queries.service';

type QueryBuilderMock = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-id',
    name: 'Alpha Site',
    nameNormalized: 'alpha site',
    companyId: null,
    company: null,
    country: null,
    stateProvince: null,
    city: null,
    status: LocationStatus.ACTIVE,
  }, overrides);
}

describe('LocationQueriesService', () => {
  let service: LocationQueriesService;
  let qb: QueryBuilderMock;
  let repository: jest.Mocked<Pick<Repository<Location>, 'createQueryBuilder' | 'findOne'>>;

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Pick<Repository<Location>, 'createQueryBuilder' | 'findOne'>>;
    service = new LocationQueriesService(repository as unknown as Repository<Location>);
  });

  it('[AC-8]', async () => {
    const locations = [makeLocation(), makeLocation({ id: 'location-2', name: 'Beta Site' })];
    qb.getManyAndCount.mockResolvedValue([locations, 2]);

    const result = await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: LocationStatus.ACTIVE,
    });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(result).toEqual({ data: locations, total: 2, page: 1, perPage: 50 });
  });

  it('[AC-9]', async () => {
    await service.findAll({ search: '  aLpHa  ' } as ListLocationsDto);

    expect(qb.andWhere).toHaveBeenCalledWith('LOWER(location.name) LIKE :search', {
      search: '%alpha%',
    });
  });

  it('[AC-10]', async () => {
    await service.findAll({
      status: LocationStatus.INACTIVE,
      country: 'Australia',
      companyId: '8ad00000-0000-4000-8000-000000000001',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', {
      status: LocationStatus.INACTIVE,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', {
      country: 'Australia',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', {
      companyId: '8ad00000-0000-4000-8000-000000000001',
    });
  });

  it('returns a Location with its associated Company loaded', async () => {
    const company = { id: 'company-id', name: 'Acme' };
    const location = makeLocation({ companyId: 'company-id', company: company as Location['company'] });
    repository.findOne.mockResolvedValue(location);

    const result = await service.findOne(location.id);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: location.id },
      relations: { company: true },
    });
    expect(result.company).toBe(company);
  });

  it('returns not found for an unknown Location', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
