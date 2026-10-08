import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from '../companies/company-usage.checker';
import { Company } from '../companies/entities/company.entity';
import { LocationQueriesController } from './location-queries.controller';
import { LocationQueriesService } from './location-queries.service';
import { Location } from './entities/location.entity';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

/** Adds this feature's reference check to the checker list owned by CompaniesModule. */
@Injectable()
class RegisterLocationCompanyUsageChecker implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly checker: LocationCompanyUsageChecker,
  ) {}

  onModuleInit(): void {
    const checkers = this.moduleRef.get<CompanyUsageChecker[]>(COMPANY_USAGE_CHECKERS, {
      strict: false,
    });
    if (!checkers.some((checker) => checker === this.checker)) {
      checkers.push(this.checker);
    }
  }
}

@Module({
  imports: [CompaniesModule, TypeOrmModule.forFeature([Location, Company])],
  providers: [
    LocationsService,
    LocationQueriesService,
    LocationCompanyUsageChecker,
    RegisterLocationCompanyUsageChecker,
  ],
  controllers: [LocationsController, LocationQueriesController],
  exports: [LocationCompanyUsageChecker],
})
export class LocationsModule {}
