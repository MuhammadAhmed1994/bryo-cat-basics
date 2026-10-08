import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsQueryController } from './locations-query.controller';
import { LocationsQueryService } from './locations-query.service';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  controllers: [LocationsController, LocationsQueryController],
  providers: [LocationsService, LocationsQueryService],
})
export class LocationsModule {}
