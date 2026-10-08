import { LocationUsageChecker } from './location-usage.checker';
import { Location } from './entities/location.entity';

describe('LocationUsageChecker', () => {
  it('[AC-16] allows multiple Locations per Company and permits an unassociated Location', async () => {
    const companyId = 'company-uuid';
    const locations = [
      { id: 'location-one', companyId },
      { id: 'location-two', companyId },
      { id: 'location-unassociated', companyId: null },
    ];
    const repository = {
      count: jest.fn(async ({ where }: { where: { companyId: string } }) =>
        locations.filter((location) => location.companyId === where.companyId).length,
      ),
    };
    const checker = new LocationUsageChecker(repository as unknown as import('typeorm').Repository<Location>);

    await expect(checker.countForCompany(companyId)).resolves.toBe(2);
    expect(repository.count).toHaveBeenCalledWith({ where: { companyId } });
    expect(locations.filter((location) => location.companyId === null)).toHaveLength(1);
  });
});
