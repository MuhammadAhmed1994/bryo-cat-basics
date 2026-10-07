import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';

/** Checks the nullable companyId foreign key used by Locations. */
@Injectable()
export class LocationCompanyUsageChecker {
  readonly label = 'Locations';

  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  countForCompany(companyId: string): Promise<number> {
    return this.locations.count({ where: { companyId } });
  }
}
