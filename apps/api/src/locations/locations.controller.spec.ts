import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';

const ACTOR = 'actor-uuid';

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

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
    status: 'ACTIVE',
    createdById: ACTOR,
    updatedById: ACTOR,
  }, overrides) as Location;
}

describe('Locations', () => {
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
      save: jest.fn((entity) => Promise.resolve(Object.assign(entity, { id: entity.id ?? 'new-uuid' }))),
      createQueryBuilder: jest.fn(() => qb),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('[AC-1]', async () => {
    // Create with a valid body; defaults to ACTIVE and companyId null when omitted
    repo.findOne.mockResolvedValue(null);

    const created = await service.create({ name: '  New Site  ' }, ACTOR);

    expect(created.status).toBe('ACTIVE');
    expect(created.companyId).toBeNull();
    expect(created.name).toBe('New Site');
  });

  it('[AC-2]', async () => {
    // DTO validation: missing/blank name -> message "Enter a location name"
    const dto = plainToInstance(CreateLocationDto, { name: '   ' });
    const errors = validateSync(dto);
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Enter a location name');
  });

  it('[AC-3]', async () => {
    // 101-char name rejected, 100-char accepted
    const oneHundred = 'x'.repeat(100);
    const oneHundredOne = 'x'.repeat(101);

    const okDto = plainToInstance(CreateLocationDto, { name: oneHundred });
    const badDto = plainToInstance(CreateLocationDto, { name: oneHundredOne });

    const okErrors = validateSync(okDto);
    const badErrors = validateSync(badDto);

    expect(okErrors.length).toBe(0);
    const messages = badErrors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Name cannot exceed 100 characters.');
  });

  it('[AC-4]', async () => {
    // Case-insensitive uniqueness on name (POST)
    repo.findOne.mockResolvedValue(makeLocation({ nameNormalized: 'sydney office' }));

    await expect(service.create({ name: 'sydney office' }, ACTOR)).rejects.toThrow(
      new ConflictException('A location with this name already exists.'),
    );

    // Uppercase variant should also collide
    await expect(service.create({ name: 'SYDNEY OFFICE' }, ACTOR)).rejects.toThrow(
      ConflictException,
    );
  });

  it('[AC-5]', async () => {
    // Phone fields validated only when provided; invalid values rejected with the same message
    const invalidPhone = plainToInstance(CreateLocationDto, { name: 'X', phone: 'abc' });
    let errors = validateSync(invalidPhone);
    let messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Enter a valid phone number.');

    const invalidContactPhone = plainToInstance(CreateLocationDto, {
      name: 'X',
      contactPersonPhone: 'abc',
    });
    errors = validateSync(invalidContactPhone);
    messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Enter a valid phone number.');

    // Omitting both phone fields is accepted
    repo.findOne.mockResolvedValue(null);
    await expect(service.create({ name: 'No Phones' }, ACTOR)).resolves.toBeTruthy();
  });

  it('[AC-9]', async () => {
    // Many locations can reference the same company; companyId may also be null
    repo.findOne.mockResolvedValue(null);
    const a = await service.create({ name: 'A', companyId: 'company-uuid' }, ACTOR);
    // next create also checks name uniqueness -> still null
    repo.findOne.mockResolvedValue(null);
    const b = await service.create({ name: 'B', companyId: 'company-uuid' }, ACTOR);

    expect(a.companyId).toBe('company-uuid');
    expect(b.companyId).toBe('company-uuid');

    // And null association is allowed (already covered in AC-1); do it again here
    repo.findOne.mockResolvedValue(null);
    const c = await service.create({ name: 'C', companyId: null }, ACTOR);
    expect(c.companyId).toBeNull();
  });

  it('[AC-11]', async () => {
    // PATCH: duplicate-name check excludes the record itself
    const existing = makeLocation({ id: 'loc-1', name: 'Sydney Office', nameNormalized: 'sydney office' });

    // First update: keep the same name with different case -> allowed
    repo.findOne
      .mockResolvedValueOnce(existing) // findOne(id)
      .mockResolvedValueOnce(existing); // assertNameIsFree(name, exceptId) returns the same record

    const updated = await service.update('loc-1', { name: 'sydney office' }, 'editor');
    expect(updated.name).toBe('sydney office');

    // Second update attempt: rename onto another existing location -> conflict
    const other = makeLocation({ id: 'loc-2', name: 'North Sydney', nameNormalized: 'north sydney' });
    repo.findOne
      .mockResolvedValueOnce(existing) // findOne(id)
      .mockResolvedValueOnce(other); // assertNameIsFree finds a different record

    await expect(
      service.update('loc-1', { name: 'North Sydney' }, 'editor'),
    ).rejects.toThrow(ConflictException);
  });

  it('[AC-12]', async () => {
    // PATCH company association: null removes, different value changes, omission keeps
    const state: { current: Location } = { current: makeLocation({ id: 'loc-1', companyId: 'c1' }) };

    repo.findOne.mockImplementation(async () => state.current);
    repo.save.mockImplementation(async (entity: Location) => {
      state.current = Object.assign(state.current, entity);
      return state.current;
    });

    let out = await service.update('loc-1', { companyId: null }, 'editor');
    expect(out.companyId).toBeNull();

    out = await service.update('loc-1', { companyId: 'c2' }, 'editor');
    expect(out.companyId).toBe('c2');

    out = await service.update('loc-1', {}, 'editor');
    expect(out.companyId).toBe('c2');
  });

  it('[AC-14]', async () => {
    // GET defaults: only ACTIVE, name ASC, page size 50
    await service.findAll({});

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(DEFAULT_PER_PAGE);
  });

  it('[AC-17]', async () => {
    // Search is partial, case-insensitive and trimmed
    await service.findAll({ search: '  syd  ' });

    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', {
      search: '%syd%',
    });

    qb.andWhere.mockClear();
    await service.findAll({ search: 'SYD' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', {
      search: '%syd%',
    });
  });

  it('[AC-19]', async () => {
    // Filters are composable: status, country and company together with search
    await service.findAll({
      status: 'INACTIVE',
      country: 'Australia',
      company: 'company-uuid',
      search: 'north',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', { companyId: 'company-uuid' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', { search: '%north%' });
  });
});
