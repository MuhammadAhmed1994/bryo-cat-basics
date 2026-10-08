import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from './company-usage.checker';
import { LocationUsageChecker } from '../locations/location-usage.checker';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), LocationsModule],
  providers: [
    CompaniesService,
    {
      provide: COMPANY_USAGE_CHECKERS,
      useFactory: (locationChecker: LocationUsageChecker): CompanyUsageChecker[] => [locationChecker],
      inject: [LocationUsageChecker],
    },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
