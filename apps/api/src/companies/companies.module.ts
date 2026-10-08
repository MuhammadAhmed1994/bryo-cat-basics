import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS } from './company-usage.checker';
import { LocationsModule } from '../locations/locations.module';
import { LocationCompanyUsageChecker } from '../locations/locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), LocationsModule],
  providers: [
    CompaniesService,
    // Modules that reference companies (Locations, Animals, …) push their
    // checkers in here so deletion stays guarded without touching the service.
    {
      provide: COMPANY_USAGE_CHECKERS,
      useFactory: (locationsChecker: LocationCompanyUsageChecker) => [locationsChecker],
      inject: [LocationCompanyUsageChecker],
    },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
