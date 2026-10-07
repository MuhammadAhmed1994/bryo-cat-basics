import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { LocationQueriesController } from './location-queries.controller';
import { LocationQueriesService } from './location-queries.service';
import { LocationCompanyUsageChecker } from './location-company-usage-checker';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Company])],
  controllers: [LocationsController, LocationQueriesController],
  providers: [LocationsService, LocationQueriesService, LocationCompanyUsageChecker],
  exports: [LocationsService, LocationQueriesService, LocationCompanyUsageChecker],
})
export class LocationsModule {}
