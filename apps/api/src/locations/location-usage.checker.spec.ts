import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationUsageChecker } from './location-usage.checker';

describe('LocationUsageChecker', () => {
  it('[AC-16] allows multiple Locations per Company and permits an unassociated Location', async () => {
    const companyId = 'f91366cc-49ee-4267-ae5a-2af46b7da43e';
    const locations = [
      { companyId },
      { companyId },
      { companyId: null },
    ];
    const repository = {
      count: jest.fn(async (options: { where: { companyId: string } }) =>
        locations.filter((location) => location.companyId === options.where.companyId).length,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocationUsageChecker,
        { provide: getRepositoryToken(Location), useValue: repository },
      ],
    }).compile();
    const checker = moduleRef.get(LocationUsageChecker);

    await expect(checker.countForCompany(companyId)).resolves.toBe(2);
    expect(repository.count).toHaveBeenCalledWith({ where: { companyId } });
    expect(locations.filter((location) => location.companyId === null)).toHaveLength(1);
  });
});
