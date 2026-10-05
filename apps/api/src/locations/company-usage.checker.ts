import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Repository } from 'typeorm';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from '../companies/company-usage.checker';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationCompanyUsageChecker implements CompanyUsageChecker {
  label = 'Locations';

  constructor(@InjectRepository(Location) private readonly locations: Repository<Location>) {}

  async countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}

/**
 * Registers the checker with CompaniesService without changing that module.
 * This uses ModuleRef to grab the shared providers list and push our entry.
 */
@Injectable()
export class LocationsCompanyUsageRegistrar implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly checker: LocationCompanyUsageChecker,
  ) {}

  onModuleInit(): void {
    try {
      const existing = this.moduleRef.get<CompanyUsageChecker[]>(COMPANY_USAGE_CHECKERS, {
        strict: false,
      });
      if (Array.isArray(existing)) existing.push(this.checker);
    } catch {
      // If CompaniesModule is not present in a unit test, ignore.
    }
  }
}
