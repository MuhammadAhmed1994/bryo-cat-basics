import { ConflictException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';
import { Company } from './entities/company.entity';
import { Location } from '../locations/entities/location.entity';

describe('LocationCompanyUsageChecker', () => {
  it('[AC-10] protects a company referenced by one or more locations from deletion', async () => {
    const locationRepository = {
      count: jest.fn().mockResolvedValue(2),
    } as unknown as import('typeorm').Repository<Location>;
    const company = Object.assign(new Company(), { id: 'company-1' });
    const companyRepository = {
      findOne: jest.fn().mockResolvedValue(company),
      remove: jest.fn().mockResolvedValue(company),
    } as unknown as import('typeorm').Repository<Company>;
    const checker = new LocationCompanyUsageChecker(locationRepository);
    const service = new CompaniesService(companyRepository, [checker]);

    await expect(service.remove(company.id)).rejects.toBeInstanceOf(ConflictException);
    expect(locationRepository.count).toHaveBeenCalledWith({
      where: { companyId: company.id },
    });
    expect(companyRepository.remove).not.toHaveBeenCalled();
  });
});
