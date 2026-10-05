import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { LocationsController } from './locations.controller';
import { LocationsService, normalizeLocationName } from './locations.service';
import { Location } from './entities/location.entity';

class AuthStubGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'actor-uuid' };
    return true;
  }
}

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
  count?: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: '00000000-0000-4000-8000-000000000000',
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
    status: 'ACTIVE' as const,
    createdById: 'actor-uuid',
    updatedById: 'actor-uuid',
  }, overrides) as Location;
}

describe('LocationsController/Service', () => {
  let app: INestApplication;
  let service: LocationsService;
  let repo: RepoMock;
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
      findOne: jest.fn(),
      create: jest.fn((dto) => Object.assign(new Location(), dto)),
      save: jest.fn((entity) => Promise.resolve(Object.assign({ id: 'new-uuid' }, entity))),
      createQueryBuilder: jest.fn(() => qb),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo },
        { provide: APP_GUARD, useClass: AuthStubGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    service = moduleRef.get(LocationsService);
  });

  afterEach(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  // [AC-1]
  it('[AC-1]', async () => {
    repo.findOne.mockResolvedValue(null);

    const res = await api().post('/api/locations').send({ name: 'Sydney Office' }).expect(201);

    expect(res.body).toMatchObject({ status: 'ACTIVE', companyId: null, name: 'Sydney Office' });
  });

  // [AC-2]
  it('[AC-2]', async () => {
    const res = await api().post('/api/locations').send({ name: '' }).expect(400);
    expect(res.body.message).toContain('Enter a location name');
  });

  // [AC-3]
  it('[AC-3]', async () => {
    await api().post('/api/locations').send({ name: 'a'.repeat(101) }).expect(400);

    repo.findOne.mockResolvedValue(null);
    await api().post('/api/locations').send({ name: 'a'.repeat(100) }).expect(201);
  });

  // [AC-4]
  it('[AC-4]', async () => {
    // With an existing location named 'Sydney Office'
    repo.findOne.mockResolvedValue(makeLocation());

    let res = await api().post('/api/locations').send({ name: 'sydney office' }).expect(400);
    expect(res.body.message).toBe('A location with this name already exists.');

    res = await api().post('/api/locations').send({ name: 'SYDNEY OFFICE' }).expect(400);
    expect(res.body.message).toBe('A location with this name already exists.');
  });

  // [AC-5]
  it('[AC-5]', async () => {
    await api().post('/api/locations').send({ name: 'X', phone: 'abc' }).expect(400);
    await api()
      .post('/api/locations')
      .send({ name: 'X', contactPersonPhone: 'abc' })
      .expect(400);

    repo.findOne.mockResolvedValue(null);
    await api().post('/api/locations').send({ name: 'X' }).expect(201);
  });

  // [AC-9]
  it('[AC-9]', async () => {
    repo.findOne.mockResolvedValue(null);
    await api().post('/api/locations').send({ name: 'North', companyId: '00000000-0000-4000-8000-000000000001' }).expect(201);

    // Another location referencing the same company id is allowed
    repo.findOne.mockResolvedValue(null);
    await api().post('/api/locations').send({ name: 'South', companyId: '00000000-0000-4000-8000-000000000001' }).expect(201);

    // companyId omitted means null
    repo.findOne.mockResolvedValue(null);
    const res = await api().post('/api/locations').send({ name: 'East' }).expect(201);
    expect(res.body.companyId).toBeNull();
  });

  // [AC-11]
  it('[AC-11]', async () => {
    const existing = makeLocation();
    // First call: find by id in update; Second call: duplicate-check returns the same record -> allowed
    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

    let res = await api()
      .patch(`/api/locations/${existing.id}`)
      .send({ name: 'sydney office' })
      .expect(200);
    expect(res.body.name).toBe('sydney office');

    // Now try to rename onto another existing location
    repo.findOne
      .mockResolvedValueOnce(existing) // fetch by id
      .mockResolvedValueOnce(makeLocation({ id: '00000000-0000-4000-8000-000000000099', name: 'Other', nameNormalized: normalizeLocationName('Other') }));

    res = await api()
      .patch(`/api/locations/${existing.id}`)
      .send({ name: 'Other' })
      .expect(400);
    expect(res.body.message).toBe('A location with this name already exists.');
  });

  // [AC-12]
  it('[AC-12]', async () => {
    const existing = makeLocation({ companyId: '00000000-0000-4000-8000-000000000001' });
    repo.findOne.mockResolvedValue(existing);

    // Remove association (null)
    let res = await api()
      .patch(`/api/locations/${existing.id}`)
      .send({ companyId: null })
      .expect(200);
    expect(res.body.companyId).toBeNull();

    // Change association to a different company id
    repo.findOne.mockResolvedValue(makeLocation({ companyId: null }));
    res = await api()
      .patch(`/api/locations/${existing.id}`)
      .send({ companyId: '00000000-0000-4000-8000-000000000002' })
      .expect(200);
    expect(res.body.companyId).toBe('00000000-0000-4000-8000-000000000002');
  });

  // [AC-14]
  it('[AC-14]', async () => {
    await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
  });

  // [AC-17]
  it('[AC-17]', async () => {
    await service.findAll({ search: ' syd ' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', { search: '%syd%' });

    await service.findAll({ search: 'SYD' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', { search: '%syd%' });
  });

  // [AC-19]
  it('[AC-19]', async () => {
    await service.findAll({ status: 'INACTIVE', country: 'Australia', company: '00000000-0000-4000-8000-000000000001' });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', { companyId: '00000000-0000-4000-8000-000000000001' });
  });
});
