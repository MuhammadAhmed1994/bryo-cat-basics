import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUsageChecker } from '../companies/company-usage.checker';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationCompanyUsageChecker implements CompanyUsageChecker {
  readonly label = 'Locations';

  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  /** Count only Locations whose nullable company_id references this Company. */
  countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}
