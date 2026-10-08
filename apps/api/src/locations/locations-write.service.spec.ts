import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationStatus } from './entities/location.entity';

type LocationRepoMock = {
  create: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
};

function makeLocation(overrides: Partial<Location> = {}): Location {
  return Object.assign(new Location(), {
    id: 'location-1',
    name: 'North Farm',
    nameNormalized: 'north farm',
    phone: null,
    country: 'Australia',
    stateProvince: null,
    city: null,
    status: LocationStatus.ACTIVE,
    companyId: null,
    company: null,
  }, overrides) as Location;
}

describe('LocationsService write operations', () => {
  let service: LocationsService;
  let repo: LocationRepoMock;

  beforeEach(() => {
    repo = {
      create: jest.fn((values) => Object.assign(new Location(), values)),
      findOne: jest.fn(),
      save: jest.fn(async (location) => location),
    };
    service = new LocationsService(repo as never);
  });

  it('[AC-2] creates a valid location active and with a selected or null company', async () => {
    repo.findOne.mockResolvedValue(null);

    const linked = await service.create({
      name: 'North Farm',
      phone: '+61400000000',
      country: 'Australia',
      stateProvince: 'NSW',
      city: 'Dubbo',
      companyId: 'company-1',
    });
    const unlinked = await service.create({ name: 'South Farm' });

    expect(linked.status).toBe(LocationStatus.ACTIVE);
    expect(linked.companyId).toBe('company-1');
    expect(linked.name).toBe('North Farm');
    expect(unlinked.companyId).toBeNull();
    expect(unlinked.status).toBe(LocationStatus.ACTIVE);
  });

  it('[AC-3] validates required name length and returns a name-specific duplicate conflict', async () => {
    expect(await validate(new CreateLocationDto())).not.toHaveLength(0);
    expect(await validate(Object.assign(new CreateLocationDto(), { name: '' }))).not.toHaveLength(0);
    expect(
      await validate(Object.assign(new CreateLocationDto(), { name: 'x'.repeat(101) })),
    ).not.toHaveLength(0);

    repo.findOne.mockResolvedValue(makeLocation());
    await expect(service.create({ name: 'NORTH FARM' })).rejects.toMatchObject({
      response: { field: 'name', message: 'A location with this name already exists.' },
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { nameNormalized: 'north farm' },
    });
  });

  it('[AC-4] accepts Company-format phone values and rejects invalid supplied values', async () => {
    const validCreate = Object.assign(new CreateLocationDto(), { name: 'Farm', phone: '+61400000000' });
    const invalidCreate = Object.assign(new CreateLocationDto(), { name: 'Farm', phone: 'abc' });
    const validUpdate = Object.assign(new UpdateLocationDto(), { phone: '(02) 1234 5678' });
    const invalidUpdate = Object.assign(new UpdateLocationDto(), { phone: '123' });

    expect(await validate(validCreate)).toHaveLength(0);
    expect(await validate(invalidCreate)).not.toHaveLength(0);
    expect(await validate(validUpdate)).toHaveLength(0);
    expect(await validate(invalidUpdate)).not.toHaveLength(0);
  });

  it('[AC-5] returns saved values and company relation, retaining or clearing company on PATCH', async () => {
    const company = { id: 'company-1', name: 'Acme' } as Location['company'];
    const detail = makeLocation({ companyId: 'company-1', company });
    repo.findOne.mockResolvedValueOnce(detail);

    const retained = await service.findOne(detail.id);
    expect(retained.company).toBe(company);

    const retainedDuringUpdate = makeLocation({ companyId: 'company-1', company });
    repo.findOne
      .mockReset()
      .mockResolvedValueOnce(retainedDuringUpdate)
      .mockResolvedValueOnce(makeLocation({ companyId: 'company-1', company, city: 'Dubbo' }));
    const unchangedAssociation = await service.update(detail.id, { city: 'Dubbo' });
    expect(unchangedAssociation.companyId).toBe('company-1');
    expect(unchangedAssociation.company).toBe(company);
    expect(unchangedAssociation.city).toBe('Dubbo');

    repo.findOne
      .mockReset()
      .mockResolvedValueOnce(makeLocation({ companyId: 'company-1', company }))
      .mockResolvedValueOnce(makeLocation({ companyId: null, company: null }));
    const cleared = await service.update(detail.id, { companyId: null });
    expect(cleared.companyId).toBeNull();
    expect(cleared.company).toBeNull();
  });

  it('[AC-6] permits an unchanged name and rejects a case-insensitive match to another location', async () => {
    const existing = makeLocation();
    repo.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing);
    const unchanged = await service.update(existing.id, { name: 'North Farm' });
    expect(unchanged.nameNormalized).toBe('north farm');

    repo.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(makeLocation({ id: 'location-2', name: 'West Farm' }));
    await expect(service.update(existing.id, { name: 'WEST FARM' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('[AC-10] stores one optional company id per location while allowing multiple locations per company', async () => {
    repo.findOne.mockResolvedValue(null);
    const first = await service.create({ name: 'Location One', companyId: 'company-shared' });
    const second = await service.create({ name: 'Location Two', companyId: 'company-shared' });
    const noCompany = await service.create({ name: 'Location Three', companyId: null });

    expect(first.companyId).toBe('company-shared');
    expect(second.companyId).toBe('company-shared');
    expect(noCompany.companyId).toBeNull();
    expect(repo.save).toHaveBeenCalledTimes(3);
  });
});
