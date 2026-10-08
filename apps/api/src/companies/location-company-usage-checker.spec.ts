import { Repository } from 'typeorm';
import { CompaniesService } from './companies.service';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';
import { Company } from './entities/company.entity';
import { Location } from '../locations/entities/location.entity';

describe('LocationCompanyUsageChecker', () => {
  it('[AC-10] protects a Company referenced by one or more Locations from deletion with HTTP 409', async () => {
    const locations = { count: jest.fn().mockResolvedValue(2) };
    const companies = {
      findOne: jest.fn().mockResolvedValue({ id: 'company-123' }),
      remove: jest.fn(),
    };
    const checker = new LocationCompanyUsageChecker(
      locations as unknown as Repository<Location>,
    );
    const service = new CompaniesService(
      companies as unknown as Repository<Company>,
      [checker],
    );

    await expect(service.remove('company-123')).rejects.toMatchObject({ status: 409 });
    expect(locations.count).toHaveBeenCalledWith({ where: { companyId: 'company-123' } });
    expect(companies.remove).not.toHaveBeenCalled();
  });
});
