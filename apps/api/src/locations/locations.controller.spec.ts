import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { applyGlobals } from '../bootstrap';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location, LocationStatus } from './entities/location.entity';
import { ListLocationsDto } from './dto/list-locations.dto';

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'loc-uuid',
    name: 'Sydney Office',
    nameNormalized: 'sydney office',
    companyId: null,
    phone: null,
    contactPersonName: null,
    contactPersonPhone: null,
    addressLine1: null,
    addressLine2: null,
    country: null,
    stateProvince: null,
    city: null,
    postalCode: null,
    status: LocationStatus.ACTIVE,
    createdById: 'actor',
    updatedById: 'actor',
  }, overrides) as Location;
}

describe('Locations API', () => {
  let app: INestApplication;
  let repo: any;

  const buildHttpApp = async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto: any) => Object.assign(new Location(), dto)),
      save: jest.fn((e: any) =>
        Promise.resolve(
          Object.assign(e, { id: e.id ?? '11111111-1111-4111-8111-111111111111' }),
        ),
      ),
      createQueryBuilder: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [LocationsService, { provide: getRepositoryToken(Location), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    // Inject a fake user so @CurrentUser works without the auth guard.
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { id: 'actor-uuid', sessionId: 'session-uuid' };
      next();
    });
    applyGlobals(app);
    await app.init();
  };

  afterEach(async () => {
    if (app) await app.close();
  });

  const api = () => request(app.getHttpServer());

  it('[AC-2] responds 400 when name is missing', async () => {
    await buildHttpApp();

    const res = await api().post('/api/locations').send({}).expect(400);
    expect(res.body.message).toContain('Enter a location name');
  });

  it('[AC-3] enforces max 100 chars for name and accepts 100', async () => {
    await buildHttpApp();

    await api().post('/api/locations').send({ name: 'a'.repeat(101) }).expect(400);

    repo.findOne.mockResolvedValueOnce(null);
    await api().post('/api/locations').send({ name: 'a'.repeat(100) }).expect(201);
  });

  it('[AC-5] validates phone fields only when provided', async () => {
    await buildHttpApp();

    await api().post('/api/locations').send({ name: 'Depot', phone: 'abc' }).expect(400);
    await api()
      .post('/api/locations')
      .send({ name: 'Depot', contactPersonPhone: '123abc' })
      .expect(400);

    repo.findOne.mockResolvedValueOnce(null);
    await api().post('/api/locations').send({ name: 'Warehouse' }).expect(201);
  });

  it('[AC-4] rejects duplicate names case-insensitively', async () => {
    await buildHttpApp();

    // First create passes (no duplicate)
    repo.findOne.mockResolvedValueOnce(null);
    await api().post('/api/locations').send({ name: 'Sydney Office' }).expect(201);

    // Second create trips the duplicate check
    repo.findOne.mockResolvedValueOnce(makeLocation({ id: 'other-uuid' }));
    const res = await api().post('/api/locations').send({ name: 'sydney office' }).expect(400);
    expect(res.body.message).toBe('A location with this name already exists.');
  });

  it('[AC-1] creates an ACTIVE location and null company when not provided', async () => {
    await buildHttpApp();

    repo.findOne.mockResolvedValueOnce(null);
    const res = await api().post('/api/locations').send({ name: 'North Sydney' }).expect(201);

    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.companyId).toBeNull();
  });

  it('[AC-9] allows multiple locations to reference the same company and null company', async () => {
    await buildHttpApp();

    repo.findOne.mockResolvedValueOnce(null);
    await api()
      .post('/api/locations')
      .send({ name: 'A', companyId: '11111111-1111-4111-8111-111111111111' })
      .expect(201);

    repo.findOne.mockResolvedValueOnce(null);
    await api()
      .post('/api/locations')
      .send({ name: 'B', companyId: '11111111-1111-4111-8111-111111111111' })
      .expect(201);

    repo.findOne.mockResolvedValueOnce(null);
    await api().post('/api/locations').send({ name: 'C', companyId: null }).expect(201);
  });

  it('[AC-11] PATCH applies duplicate-name rules excluding self', async () => {
    await buildHttpApp();

    // Seed an existing location
    repo.findOne.mockResolvedValueOnce(null);
    const created = await api().post('/api/locations').send({ name: 'Sydney Office' }).expect(201);

    // Load existing for update, allow keeping same name in different case
    repo.findOne
      .mockResolvedValueOnce(makeLocation({ id: created.body.id, name: 'Sydney Office', nameNormalized: 'sydney office' })) // findOne(id)
      .mockResolvedValueOnce(makeLocation({ id: created.body.id, nameNormalized: 'sydney office' })); // assertNameIsFree

    await api()
      .patch(`/api/locations/${created.body.id}`)
      .send({ name: 'SYDNEY OFFICE' })
      .expect(200);

    // Now try renaming onto another existing record
    repo.findOne
      .mockResolvedValueOnce(makeLocation({ id: created.body.id })) // findOne(id)
      .mockResolvedValueOnce(makeLocation({ id: 'other-uuid', nameNormalized: 'north sydney' })); // assertNameIsFree hits other

    const res = await api()
      .patch(`/api/locations/${created.body.id}`)
      .send({ name: 'North Sydney' })
      .expect(400);

    expect(res.body.message).toBe('A location with this name already exists.');
  });

  it('[AC-12] PATCH can remove or change the company association', async () => {
    await buildHttpApp();

    // Create with an association
    repo.findOne.mockResolvedValueOnce(null);
    const created = await api()
      .post('/api/locations')
      .send({ name: 'Warehouse', companyId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
      .expect(201);

    // Removing association (null)
    repo.findOne.mockResolvedValueOnce(makeLocation({ id: created.body.id, companyId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }));
    const removed = await api()
      .patch(`/api/locations/${created.body.id}`)
      .send({ companyId: null })
      .expect(200);
    expect(removed.body.companyId).toBeNull();

    // Changing association
    repo.findOne.mockResolvedValueOnce(makeLocation({ id: created.body.id, companyId: null }));
    const changed = await api()
      .patch(`/api/locations/${created.body.id}`)
      .send({ companyId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' })
      .expect(200);
    expect(changed.body.companyId).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  });
});

describe('LocationsService list/query', () => {
  let service: LocationsService;
  let repo: any;
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto: any) => Object.assign(new Location(), dto)),
      save: jest.fn((e: any) => Promise.resolve(Object.assign(e, { id: e.id ?? 'new-uuid' }))),
      createQueryBuilder: jest.fn(() => qb),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [LocationsService, { provide: getRepositoryToken(Location), useValue: repo }],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('[AC-14] defaults to ACTIVE only, name ASC and page size 50', async () => {
    await service.findAll({} as ListLocationsDto);

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
  });

  it('[AC-17] search is partial, case-insensitive and trimmed', async () => {
    await service.findAll({ search: ' syd ' } as ListLocationsDto);
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', { search: '%syd%' });

    await service.findAll({ search: 'SYD' } as ListLocationsDto);
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', { search: '%syd%' });
  });

  it('[AC-19] applies status, country and company filters together', async () => {
    await service.findAll({ status: 'INACTIVE', country: 'Australia', company: '11111111-1111-4111-8111-111111111111' });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', { companyId: '11111111-1111-4111-8111-111111111111' });
  });
});
