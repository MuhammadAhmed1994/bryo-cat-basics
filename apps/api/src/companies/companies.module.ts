import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS } from './company-usage.checker';
import { Location } from '../locations/entities/location.entity';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Location])],
  providers: [
    CompaniesService,
    LocationCompanyUsageChecker,
    {
      provide: COMPANY_USAGE_CHECKERS,
      useFactory: (locationChecker: LocationCompanyUsageChecker) => [locationChecker],
      inject: [LocationCompanyUsageChecker],
    },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
