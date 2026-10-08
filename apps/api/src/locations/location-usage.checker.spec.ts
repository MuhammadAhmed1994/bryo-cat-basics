import { LocationUsageChecker } from './location-usage.checker';
import { Location } from './entities/location.entity';

describe('LocationUsageChecker', () => {
  it('[AC-16] allows multiple Locations per Company and permits an unassociated Location', async () => {
    const companyId = 'company-uuid';
    const locations: Array<Pick<Location, 'companyId'>> = [
      { companyId },
      { companyId },
      { companyId: null },
    ];
    const repository = {
      count: jest.fn(async ({ where }: { where: { companyId: string } }) =>
        locations.filter((location) => location.companyId === where.companyId).length,
      ),
    };
    const checker = new LocationUsageChecker(repository as never);

    await expect(checker.countForCompany(companyId)).resolves.toBe(2);
    expect(repository.count).toHaveBeenCalledWith({ where: { companyId } });
  });
});
