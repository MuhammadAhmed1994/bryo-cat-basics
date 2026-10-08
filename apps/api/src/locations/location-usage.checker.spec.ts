import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationUsageChecker } from './location-usage.checker';

describe('LocationUsageChecker', () => {
  it('[AC-16] allows multiple Locations per Company and permits an unassociated Location', async () => {
    const companyId = 'company-uuid';
    const records = [
      { id: 'location-1', companyId },
      { id: 'location-2', companyId },
      { id: 'location-unassociated', companyId: null },
    ];
    const repository = {
      count: jest.fn(async ({ where }: { where: { companyId: string } }) =>
        records.filter((location) => location.companyId === where.companyId).length,
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationUsageChecker,
        { provide: getRepositoryToken(Location), useValue: repository },
      ],
    }).compile();
    const checker = moduleRef.get(LocationUsageChecker);

    expect(await checker.countForCompany(companyId)).toBe(2);
    expect(records.filter((location) => location.companyId === null)).toHaveLength(1);
    expect(repository.count).toHaveBeenCalledWith({ where: { companyId } });
  });
});
