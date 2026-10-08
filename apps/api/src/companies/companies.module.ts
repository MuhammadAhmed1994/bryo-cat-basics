import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { Location } from '../locations/entities/location.entity';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from './company-usage.checker';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Location])],
  providers: [
    CompaniesService,
    LocationCompanyUsageChecker,
    {
      provide: COMPANY_USAGE_CHECKERS,
      useFactory: (checker: LocationCompanyUsageChecker): CompanyUsageChecker[] => [checker],
      inject: [LocationCompanyUsageChecker],
    },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
