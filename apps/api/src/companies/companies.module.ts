import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS } from './company-usage.checker';
import { LocationsModule } from '../locations/locations.module';
import { LocationUsageChecker } from '../locations/location-usage.checker';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), LocationsModule],
  providers: [
    CompaniesService,
    // Modules that reference companies register checkers here so deletion
    // stays guarded without making CompaniesService know about those modules.
    {
      provide: COMPANY_USAGE_CHECKERS,
      useFactory: (locationsChecker: LocationUsageChecker) => [locationsChecker],
      inject: [LocationUsageChecker],
    },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
