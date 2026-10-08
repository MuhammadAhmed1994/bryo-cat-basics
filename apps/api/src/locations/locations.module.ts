import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Location } from './entities/location.entity';
import { LocationUsageChecker } from './location-usage.checker';
import { LocationsController } from './locations.controller';
import { LocationsListController } from './locations-list.controller';
import { LocationsQueryService } from './locations-query.service';
import { LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Company])],
  controllers: [LocationsController, LocationsListController],
  providers: [LocationsService, LocationsQueryService, LocationUsageChecker],
  exports: [LocationUsageChecker],
})
export class LocationsModule {}
