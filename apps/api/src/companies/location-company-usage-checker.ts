import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../locations/entities/location.entity';
import { CompanyUsageChecker } from './company-usage.checker';

@Injectable()
export class LocationCompanyUsageChecker implements CompanyUsageChecker {
  readonly label = 'locations';

  constructor(
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
  ) {}

  async countForCompany(companyId: string): Promise<number> {
    const count = await this.locations.count({ where: { companyId } });
    if (count > 0) {
      throw new ConflictException(
        'This company cannot be deleted because it is being used by existing records.',
      );
    }
    return count;
  }
}
