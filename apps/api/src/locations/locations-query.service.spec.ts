import { Repository, SelectQueryBuilder } from 'typeorm';
import { LocationsQueryService } from './locations-query.service';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location, LocationStatus } from './entities/location.entity';

describe('LocationsQueryService', () => {
  let service: LocationsQueryService;
  let queryBuilder: Record<string, jest.Mock>;
  let resultRows: Location[];
  let totalRows: number;

  beforeEach(() => {
    resultRows = [];
    totalRows = 0;
    queryBuilder = {};
    for (const method of ['leftJoinAndSelect', 'andWhere', 'orderBy', 'skip', 'take']) {
      queryBuilder[method] = jest.fn().mockReturnValue(queryBuilder);
    }
    queryBuilder.getManyAndCount = jest.fn(async () => [resultRows, totalRows]);

    const repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    } as unknown as Repository<Location>;
    service = new LocationsQueryService(repository);
  });

  it('[AC-8] matches partial Location names without regard to letter case', async () => {
    const location = Object.assign(new Location(), { name: 'North Valley Farm' });
    resultRows = [location];
    totalRows = 1;

    const response = await service.findAll({ search: '  vAlLeY  ' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(location.name) LIKE :search',
      { search: '%valley%' },
    );
    expect(response.data).toContain(location);
    expect(response.total).toBe(1);
  });

  it('defaults to active Locations, name ascending, and 50 rows per page with Company loaded', async () => {
    const response = await service.findAll(new ListLocationsDto());

    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'location.company',
      'company',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.status = :status',
      { status: LocationStatus.ACTIVE },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
    expect(response).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
  });

  it('applies status, stored country value, and Company ID filters together', async () => {
    await service.findAll({
      status: 'INACTIVE',
      country: 'Australia',
      companyId: 'company-identifier',
      page: 2,
      perPage: 25,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.status = :status',
      { status: 'INACTIVE' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.country = :country',
      { country: 'Australia' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'location.companyId = :companyId',
      { companyId: 'company-identifier' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(25);
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
  });
});
