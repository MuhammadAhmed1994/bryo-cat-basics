import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUsageChecker, COMPANY_USAGE_CHECKERS } from '../companies/company-usage.checker';
import { Location } from './entities/location.entity';

/**
 * Provider that registers a usage checker with CompaniesService so a company
 * cannot be deleted while locations reference it.
 */
export const registerLocationsCompanyUsageChecker = {
  provide: 'REGISTER_LOCATIONS_COMPANY_USAGE_CHECKER',
  useFactory: (arr: CompanyUsageChecker[], repo: Repository<Location>) => {
    arr.push({
      label: 'locations',
      countForCompany: (companyId: string) => repo.count({ where: { companyId } }),
    });
    return true;
  },
  inject: [COMPANY_USAGE_CHECKERS, InjectRepository(Location)],
};
