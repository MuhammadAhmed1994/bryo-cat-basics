import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationUsageChecker } from './location-usage.checker';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsListController } from './locations-list.controller';
import { LocationsQueryService } from './locations-query.service';
import { LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [
    LocationUsageChecker,
    LocationsService,
    LocationsQueryService,
  ],
  controllers: [LocationsController, LocationsListController],
  exports: [LocationUsageChecker],
})
export class LocationsModule {}
