import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { CompaniesModule } from '../companies/companies.module';
import { CompaniesService } from '../companies/companies.service';
import { CompanyUsageChecker } from '../companies/company-usage.checker';
import { LocationQueriesController } from './location-queries.controller';
import { LocationQueriesService } from './location-queries.service';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';

/** Adds this feature's checker to the registry consumed by CompaniesService. */
@Injectable()
class RegisterLocationCompanyUsageChecker implements OnModuleInit {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly checker: LocationCompanyUsageChecker,
  ) {}

  onModuleInit(): void {
    // CompaniesModule owns the convention's shared checker array. Its existing
    // provider isn't extensible through Nest module imports, so extend that
    // array on the existing service instance during module initialization.
    const serviceWithRegistry = this.companiesService as unknown as {
      usageCheckers: CompanyUsageChecker[];
    };
    if (!serviceWithRegistry.usageCheckers.includes(this.checker)) {
      serviceWithRegistry.usageCheckers.push(this.checker);
    }
  }
}

@Module({
  imports: [CompaniesModule, TypeOrmModule.forFeature([Location, Company])],
  controllers: [LocationsController, LocationQueriesController],
  providers: [
    LocationsService,
    LocationQueriesService,
    LocationCompanyUsageChecker,
    RegisterLocationCompanyUsageChecker,
  ],
  exports: [LocationsService, LocationQueriesService, LocationCompanyUsageChecker],
})
export class LocationsModule {}
