import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUsageChecker } from '../companies/company-usage.checker';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationUsageChecker implements CompanyUsageChecker {
  readonly label = 'locations';

  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}
