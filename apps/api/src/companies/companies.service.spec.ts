import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from './company-usage.checker';

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const ACTOR = 'actor-uuid';

function makeCompany(overrides: Partial<Company> = {}): Company {
  return Object.assign(new Company(), {
    id: 'company-uuid',
    name: 'Acme Genetics',
    nameNormalized: 'acme genetics',
    phone: '+61400000000',
    email: null,
    website: null,
    billingAddress: {
      line1: null, line2: null, country: null, state: null, city: null, postalCode: null,
    },
    shippingSameAsBilling: true,
    shippingAddress: {
      line1: null, line2: null, country: null, state: null, city: null, postalCode: null,
    },
    isActive: true,
    createdById: ACTOR,
    updatedById: ACTOR,
  }, overrides) as Company;
}

describe('CompaniesService', () => {
  let service: CompaniesService;
  let repo: RepoMock;
  let qb: Record<string, jest.Mock>;
  let usage: CompanyUsageChecker;

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
      create: jest.fn((dto) => Object.assign(new Company(), dto)),
      save: jest.fn((entity) => Promise.resolve(Object.assign(entity, { id: entity.id ?? 'new-uuid' }))),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => qb),
    };
    usage = { label: 'animals', countForCompany: jest.fn().mockResolvedValue(0) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: repo },
        { provide: COMPANY_USAGE_CHECKERS, useValue: [usage] },
      ],
    }).compile();

    service = moduleRef.get(CompaniesService);
  });

  describe('create', () => {
    it('saves a company with a normalized name, Active status and audit fields', async () => {
      repo.findOne.mockResolvedValue(null);

      const created = await service.create(
        { name: '  Acme Genetics ', phone: '+61400000000' },
        ACTOR,
      );

      expect(created.name).toBe('Acme Genetics');
      expect(created.nameNormalized).toBe('acme genetics');
      expect(created.isActive).toBe(true);
      expect(created.createdById).toBe(ACTOR);
      expect(created.updatedById).toBe(ACTOR);
    });

    it('rejects a duplicate name regardless of case (spec 2.8.1)', async () => {
      repo.findOne.mockResolvedValue(makeCompany());

      await expect(
        service.create({ name: 'ACME GENETICS', phone: '+61400000000' }, ACTOR),
      ).rejects.toThrow(ConflictException);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { nameNormalized: 'acme genetics' },
      });
    });

    it('copies the billing address into shipping when they are the same', async () => {
      repo.findOne.mockResolvedValue(null);

      const created = await service.create(
        {
          name: 'Acme',
          phone: '+61400000000',
          billingAddress: { line1: '1 Farm Rd', country: 'Australia', city: 'Dubbo' },
          shippingSameAsBilling: true,
        },
        ACTOR,
      );

      expect(created.shippingAddress.line1).toBe('1 Farm Rd');
      expect(created.shippingAddress.city).toBe('Dubbo');
    });

    it('keeps a distinct shipping address when the box is unchecked', async () => {
      repo.findOne.mockResolvedValue(null);

      const created = await service.create(
        {
          name: 'Acme',
          phone: '+61400000000',
          billingAddress: { line1: '1 Farm Rd' },
          shippingSameAsBilling: false,
          shippingAddress: { line1: '9 Depot St' },
        },
        ACTOR,
      );

      expect(created.shippingAddress.line1).toBe('9 Depot St');
    });
  });

  describe('findOne', () => {
    it('throws when the company does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('allows a company to keep its own name', async () => {
      const existing = makeCompany();
      repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

      const updated = await service.update(existing.id, { name: 'Acme Genetics' }, 'editor');

      expect(updated.name).toBe('Acme Genetics');
      expect(updated.updatedById).toBe('editor');
    });

    it('rejects renaming onto another company name', async () => {
      repo.findOne
        .mockResolvedValueOnce(makeCompany())
        .mockResolvedValueOnce(makeCompany({ id: 'other-uuid', nameNormalized: 'bravo' }));

      await expect(
        service.update('company-uuid', { name: 'Bravo' }, 'editor'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes a company that nothing references', async () => {
      const existing = makeCompany();
      repo.findOne.mockResolvedValue(existing);

      await service.remove(existing.id);

      expect(repo.remove).toHaveBeenCalledWith(existing);
    });

    it('refuses to delete a company that is in use (spec 2.8.4)', async () => {
      repo.findOne.mockResolvedValue(makeCompany());
      (usage.countForCompany as jest.Mock).mockResolvedValue(3);

      await expect(service.remove('company-uuid')).rejects.toThrow(BadRequestException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('setActive', () => {
    it('deactivates a company and records who changed it', async () => {
      repo.findOne.mockResolvedValue(makeCompany({ isActive: true }));

      const result = await service.setActive('company-uuid', false, 'editor');

      expect(result.isActive).toBe(false);
      expect(result.updatedById).toBe('editor');
    });
  });

  describe('findAll', () => {
    it('shows only active companies by default (spec 2.8.7)', async () => {
      await service.findAll({});

      expect(qb.andWhere).toHaveBeenCalledWith('company.isActive = :isActive', {
        isActive: true,
      });
    });

    it('[AC-12] filters Company choices to active companies', async () => {
      const activeCompany = makeCompany({ isActive: true });
      qb.getManyAndCount.mockResolvedValue([[activeCompany], 1]);

      const result = await service.findAll({ activeOnly: true });

      expect(qb.andWhere).toHaveBeenCalledWith('company.isActive = :activeOnly', {
        activeOnly: true,
      });
      expect(result.data).toEqual([activeCompany]);
      expect(result.data.every((company) => company.isActive)).toBe(true);
    });

    it('filters to inactive companies when asked', async () => {
      await service.findAll({ status: 'INACTIVE' });

      expect(qb.andWhere).toHaveBeenCalledWith('company.isActive = :isActive', {
        isActive: false,
      });
    });

    it('applies no status filter for "ALL"', async () => {
      await service.findAll({ status: 'ALL' });

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'company.isActive = :isActive',
        expect.anything(),
      );
    });

    it('searches by name, case-insensitively and ignoring outer spaces', async () => {
      await service.findAll({ search: '  acME  ' });

      expect(qb.andWhere).toHaveBeenCalledWith('company.nameNormalized LIKE :search', {
        search: '%acme%',
      });
    });

    it('filters by billing country', async () => {
      await service.findAll({ country: 'Australia' });

      expect(qb.andWhere).toHaveBeenCalledWith('company.billingAddress.country = :country', {
        country: 'Australia',
      });
    });

    it('defaults to 50 rows per page sorted by name ascending (spec 2.2.7)', async () => {
      const result = await service.findAll({});

      expect(qb.orderBy).toHaveBeenCalledWith('company.name', 'ASC');
      expect(qb.take).toHaveBeenCalledWith(50);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
    });

    it('honours page size and sort direction', async () => {
      await service.findAll({ page: 3, perPage: 25, sortDir: 'DESC' });

      expect(qb.orderBy).toHaveBeenCalledWith('company.name', 'DESC');
      expect(qb.take).toHaveBeenCalledWith(25);
      expect(qb.skip).toHaveBeenCalledWith(50);
    });
  });
});
