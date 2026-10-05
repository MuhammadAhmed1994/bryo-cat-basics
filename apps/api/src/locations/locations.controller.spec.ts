import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validateSync } from 'class-validator';
import { Company } from '../companies/entities/company.entity';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationStatus } from './entities/location.entity';
import { LocationsService, normalizeLocationName } from './locations.service';

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
  let service: LocationsService;
  let locRepo: any;
  let cmpRepo: any;
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    locRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<Location>) => Object.assign(new Location(), dto)),
      save: jest.fn((e: Location) => Promise.resolve(Object.assign(e, { id: e.id ?? 'new-uuid' }))),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => qb),
    };
    cmpRepo = {
      findOne: jest.fn().mockResolvedValue(new Company()),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locRepo },
        { provide: getRepositoryToken(Company), useValue: cmpRepo },
      ],
    }).compile();

    service = moduleRef.get(LocationsService);
  });

  it('AC-1', async () => {
    locRepo.findOne.mockResolvedValue(null);

    const dto: CreateLocationDto = { name: ' Sydney Office ' } as any;
    const created = await service.create(dto, 'actor');
    expect(created.status).toBe(LocationStatus.ACTIVE);
    expect(created.companyId).toBeNull();
  });

  it('AC-2', () => {
    const dto = new CreateLocationDto() as any;
    dto.name = '';
    const errors = validateSync(dto);
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Enter a location name');
  });

  it('AC-3', () => {
    const good = new CreateLocationDto() as any;
    good.name = 'a'.repeat(100);
    expect(validateSync(good)).toHaveLength(0);

    const bad = new CreateLocationDto() as any;
    bad.name = 'a'.repeat(101);
    const errors = validateSync(bad);
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Name cannot exceed 100 characters.');
  });

  it('AC-4', async () => {
    locRepo.findOne.mockResolvedValueOnce(makeLocation());

    await expect(service.create({ name: 'sydney office' } as any, 'actor')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('AC-5', () => {
    const invalid = new CreateLocationDto() as any;
    invalid.name = 'Ok';
    invalid.phone = 'abc';
    const errors = validateSync(invalid);
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('Enter a valid phone number.');

    const omitted = new CreateLocationDto() as any;
    omitted.name = 'Ok';
    expect(validateSync(omitted)).toHaveLength(0);
  });

  it('AC-9', async () => {
    locRepo.findOne.mockResolvedValue(null);
    cmpRepo.findOne.mockResolvedValue(new Company());

    const first = await service.create({ name: 'A', companyId: 'c-uuid' } as any, 'actor');
    const second = await service.create({ name: 'B', companyId: 'c-uuid' } as any, 'actor');

    expect(first.companyId).toBe('c-uuid');
    expect(second.companyId).toBe('c-uuid');
  });

  it('AC-11', async () => {
    const existing = makeLocation({ id: '1', name: 'Sydney Office', nameNormalized: normalizeLocationName('Sydney Office') });
    locRepo.findOne
      .mockResolvedValueOnce(existing) // for findOne(id)
      .mockResolvedValueOnce(existing); // for assertNameIsFree self

    const ok = await service.update('1', { name: 'sydney office' } as UpdateLocationDto, 'editor');
    expect(ok.name).toBe('sydney office');

    const other = makeLocation({ id: '2', name: 'North Sydney', nameNormalized: 'north sydney' });
    locRepo.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(other);

    await expect(
      service.update('1', { name: 'North Sydney' } as UpdateLocationDto, 'editor'),
    ).rejects.toThrow(BadRequestException);
  });

  it('AC-12', async () => {
    const existing = makeLocation({ id: '1', companyId: 'comp-1' });
    locRepo.findOne.mockResolvedValue(existing);

    // remove association
    let updated = await service.update('1', { companyId: null }, 'editor');
    expect(updated.companyId).toBeNull();

    // change association
    cmpRepo.findOne.mockResolvedValue(new Company());
    locRepo.findOne.mockResolvedValueOnce({ ...existing, companyId: 'comp-1' });
    updated = await service.update('1', { companyId: 'comp-2' }, 'editor');
    expect(updated.companyId).toBe('comp-2');

    // keep association (no companyId in DTO)
    locRepo.findOne.mockResolvedValueOnce({ ...existing, companyId: 'comp-3' });
    updated = await service.update('1', {}, 'editor');
    expect(updated.companyId).toBe('comp-3');
  });

  it('AC-14', async () => {
    await service.findAll({} as ListLocationsDto);
    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'ACTIVE' });
    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(DEFAULT_PER_PAGE);
  });

  it('AC-17', async () => {
    await service.findAll({ search: ' syd ' } as ListLocationsDto);
    expect(qb.andWhere).toHaveBeenCalledWith('location.nameNormalized LIKE :search', {
      search: '%syd%',
    });
  });

  it('AC-19', async () => {
    await service.findAll({ status: 'INACTIVE', country: 'Australia', company: 'c-uuid' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.status = :status', { status: 'INACTIVE' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.country = :country', { country: 'Australia' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.companyId = :company', { company: 'c-uuid' });
  });
});
