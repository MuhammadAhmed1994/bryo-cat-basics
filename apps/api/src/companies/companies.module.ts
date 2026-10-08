import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS } from './company-usage.checker';
import { Location } from '../locations/entities/location.entity';
import { LocationUsageChecker } from '../locations/location-usage.checker';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Location])],
  providers: [
    CompaniesService,
    LocationUsageChecker,
    { provide: COMPANY_USAGE_CHECKERS, useExisting: LocationUsageChecker },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
