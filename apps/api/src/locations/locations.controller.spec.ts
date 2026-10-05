import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { LocationsService } from './locations.service';
import { Location, LocationStatus } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

const ACTOR = 'actor-uuid';

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
  count: jest.Mock;
};

type QbMock = Record<string, jest.Mock> & { getManyAndCount: jest.Mock };

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
    createdById: ACTOR,
    updatedById: ACTOR,
  }, overrides) as Location;
}

describe('Locations API', () => {
  let service: LocationsService;
  let repo: RepoMock;
  let qb: QbMock;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    } as unknown as QbMock;

    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => Object.assign(new Location(), dto)),
      save: jest.fn((entity) => Promise.resolve(Object.assign(entity, { id: entity.id ?? 'new-uuid' }))),
      createQueryBuilder: jest.fn(() => qb),
      count: jest.fn().mockResolvedValue(0),
    } as unknown as RepoMock;

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('AC-1', async () => {
    repo.findOne.mockResolvedValue(null);

    const created = await service.create(
      { name: '  Sydney Office  ' } as CreateLocationDto,
      ACTOR,
    );

    expect(created.status).toBe(LocationStatus.ACTIVE);
    expect(created.companyId).toBeNull();
  });

  it('AC-2', async () => {
    const dto = new CreateLocationDto();
    dto.name = '' as any;
    const errors = await validate(dto);
    expect(errors.some((e) => e.constraints && Object.values(e.constraints).includes('Enter a location name'))).toBe(
      true,
    );
  });

  it('AC-3', async () => {
    const over = new CreateLocationDto();
    over.name = 'x'.repeat(101);
    const errors = await validate(over);
    expect(errors.some((e) => e.constraints && Object.values(e.constraints).includes('Name cannot exceed 100 characters.'))).toBe(
      true,
    );

    const ok = new CreateLocationDto();
    ok.name = 'x'.repeat(100);
    const okErrors = await validate(ok);
    expect(okErrors.length).toBe(0);
  });

  it('AC-4', async () => {
    repo.findOne.mockResolvedValue(makeLocation());

    await expect(
      service.create({ name: 'sydney office' } as CreateLocationDto, ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('AC-5', async () => {
    const bad1 = new CreateLocationDto();
    bad1.name = 'Valid';
    bad1.phone = 'abc' as any;
    let errors = await validate(bad1);
    expect(errors.some((e) => (e.constraints && Object.values(e.constraints).includes('Enter a valid phone number.')))).toBe(
      true,
    );

    const bad2 = new CreateLocationDto();
    bad2.name = 'Valid';
    bad2.contactPersonPhone = 'abc' as any;
    errors = await validate(bad2);
    expect(errors.some((e) => (e.constraints && Object.values(e.constraints).includes('Enter a valid phone number.')))).toBe(
      true,
    );

    const ok = new CreateLocationDto();
    ok.name = 'Valid';
    const okErrors = await validate(ok);
    expect(okErrors.length).toBe(0);
  });

  it('AC-9', async () => {
    repo.findOne.mockResolvedValue(null);

    const a = await service.create(
      { name: 'A', companyId: 'co-uuid' } as CreateLocationDto,
      ACTOR,
    );
    const b = await service.create(
      { name: 'B', companyId: 'co-uuid' } as CreateLocationDto,
      ACTOR,
    );

    expect(a.companyId).toBe('co-uuid');
    expect(b.companyId).toBe('co-uuid');

    const c = await service.create({ name: 'C' } as CreateLocationDto, ACTOR);
    expect(c.companyId).toBeNull();
  });

  it('AC-11', async () => {
    const existing = makeLocation();
    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

    const keepCase = await service.update(
      existing.id,
      { name: 'sydney office' } as UpdateLocationDto,
      ACTOR,
    );
    expect(keepCase.name).toBe('sydney office');

    repo.findOne
      .mockResolvedValueOnce(makeLocation())
      .mockResolvedValueOnce(makeLocation({ id: 'other-uuid', nameNormalized: 'north sydney' }));

    await expect(
      service.update(existing.id, { name: 'North Sydney' } as UpdateLocationDto, ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('AC-12', async () => {
    const existing = makeLocation({ companyId: 'old-co' });
    repo.findOne.mockResolvedValue(existing);

    const removed = await service.update(existing.id, { companyId: null }, ACTOR);
    expect(removed.companyId).toBeNull();

    const changed = await service.update(existing.id, { companyId: 'new-co' }, ACTOR);
    expect(changed.companyId).toBe('new-co');
  });

  it('AC-14', async () => {
    await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(qb.skip).toHaveBeenCalledWith(0);
  });

  it('AC-17', async () => {
    await service.findAll({ search: '  SYD  ' });

    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', {
      search: '%syd%',
    });
  });

  it('AC-19', async () => {
    await service.findAll({ status: 'INACTIVE', country: 'Australia', company: 'co-1' });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :company', { company: 'co-1' });
  });
});
