import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsQueryController } from './locations-query.controller';
import { LocationsService } from './locations.service';
import { LocationsQueryService } from './locations-query.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  controllers: [LocationsController, LocationsQueryController],
  providers: [LocationsService, LocationsQueryService],
  exports: [LocationsService, LocationsQueryService],
})
export class LocationsModule {}
