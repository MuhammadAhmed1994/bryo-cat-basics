import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLocationDto } from './dto/create-location.dto';

// Minimal in-memory mocks for repository and its query builder

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  count: jest.Mock;
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
    addedById: 'actor',
    updatedById: 'actor',
  }, overrides) as Location;
}

describe('LocationsService', () => {
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
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as RepoMock;

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: repo as unknown as Repository<Location> },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('[AC-1] creates a location as ACTIVE with null companyId by default', async () => {
    repo.findOne.mockResolvedValue(null);

    const created = await service.create({ name: '  Sydney Office  ' }, 'actor');

    expect(created.name).toBe('Sydney Office');
    expect(created.nameNormalized).toBe('sydney office');
    expect(created.status).toBe('ACTIVE');
    expect(created.companyId).toBeNull();
  });

  it('[AC-2] rejects missing name with the requested message', async () => {
    const dto = plainToInstance(CreateLocationDto, {});
    const errors = await validate(dto);
    expect(JSON.stringify(errors)).toContain('Enter a location name');
  });

  it('[AC-3] rejects a 101-character name via DTO constraints (MaxLength); accepts 100', async () => {
    const tooLong = plainToInstance(CreateLocationDto, { name: 'x'.repeat(101) });
    const longErrors = await validate(tooLong);
    expect(JSON.stringify(longErrors)).toContain('Name cannot exceed 100 characters.');

    const ok = plainToInstance(CreateLocationDto, { name: 'x'.repeat(100) });
    const okErrors = await validate(ok);
    expect(okErrors.length).toBe(0);
  });

  it('[AC-4] rejects duplicate name case-insensitively with the specified message', async () => {
    repo.findOne.mockResolvedValueOnce(makeLocation({ name: 'Sydney Office', nameNormalized: 'sydney office' }));

    await expect(service.create({ name: 'SYDNEY OFFICE' }, 'actor')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('[AC-5] validates phone fields only when provided (invalid when present); omitting both passes', async () => {
    const invalidPhone = plainToInstance(CreateLocationDto, { name: 'With Phone', phone: 'abc' });
    const invalidErrors = await validate(invalidPhone);
    expect(JSON.stringify(invalidErrors)).toContain('Enter a valid phone number.');

    const invalidContact = plainToInstance(CreateLocationDto, { name: 'With C', contactPersonPhone: 'abc' });
    const invalidContactErrors = await validate(invalidContact);
    expect(JSON.stringify(invalidContactErrors)).toContain('Enter a valid phone number.');

    const ok = plainToInstance(CreateLocationDto, { name: 'Valid' });
    const okErrors = await validate(ok);
    expect(okErrors.length).toBe(0);
  });

  it('[AC-9] allows multiple locations to reference the same company and null companyId', async () => {
    repo.findOne.mockResolvedValue(null);

    const a = await service.create({ name: 'A', companyId: null } as any, 'actor');
    const b = await service.create({ name: 'B', companyId: null } as any, 'actor');

    expect(a.companyId).toBeNull();
    expect(b.companyId).toBeNull();
  });

  it('[AC-11] update keeps its own name and rejects renaming onto another record', async () => {
    const existing = makeLocation({ id: 'loc-1', name: 'Sydney Office', nameNormalized: 'sydney office' });
    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

    const updated = await service.update('loc-1', { name: 'sydney office' }, 'editor');
    expect(updated.nameNormalized).toBe('sydney office');

    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(makeLocation({ id: 'loc-2', nameNormalized: 'north sydney' }));
    await expect(service.update('loc-1', { name: 'North Sydney' }, 'editor')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('[AC-12] update supports association change and removal (companyId = null persists)', async () => {
    const existing = makeLocation({ id: 'loc-1', companyId: 'comp-1' });
    repo.findOne.mockResolvedValue(existing);

    const removed = await service.update('loc-1', { companyId: null }, 'editor');
    expect(removed.companyId).toBeNull();
  });

  it('[AC-14] list defaults to ACTIVE only, name ASC and 50 per page', async () => {
    await service.findAll({});
    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(qb.skip).toHaveBeenCalledWith(0);
  });

  it('[AC-17] search is trimmed and case-insensitive partial on name', async () => {
    await service.findAll({ search: '  SyD  ' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', { search: '%syd%' });
  });

  it('[AC-19] filters by status/country/company and composes with search', async () => {
    await service.findAll({ status: 'INACTIVE', country: 'Australia', company: 'comp-1', search: 'syd' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :companyId', { companyId: 'comp-1' });
  });
});
