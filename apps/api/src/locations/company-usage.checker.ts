import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from '../companies/company-usage.checker';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsCompanyUsageChecker
  implements CompanyUsageChecker, OnModuleInit
{
  label = 'locations';

  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @Inject(COMPANY_USAGE_CHECKERS)
    private readonly usageCheckers: CompanyUsageChecker[],
  ) {}

  async onModuleInit(): Promise<void> {
    // Register this checker with CompaniesModule's shared array.
    this.usageCheckers.push(this);
  }

  async countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}
