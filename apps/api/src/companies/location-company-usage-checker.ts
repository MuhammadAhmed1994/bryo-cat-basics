import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUsageChecker } from './company-usage.checker';
import { Location } from '../locations/entities/location.entity';

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
      // CompaniesService propagates usage-checker exceptions; using a conflict
      // here ensures the DELETE endpoint reports HTTP 409 for referenced rows.
      throw new ConflictException(
        'This company cannot be deleted because Locations are using it.',
      );
    }
    return count;
  }
}
