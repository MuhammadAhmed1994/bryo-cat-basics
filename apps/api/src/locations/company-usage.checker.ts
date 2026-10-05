import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CompanyUsageChecker } from '../companies/company-usage.checker';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsCompanyUsageChecker implements CompanyUsageChecker {
  label = 'locations';

  constructor(
    @InjectRepository(Location) private readonly locations: Repository<Location>,
  ) {}

  async countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}
