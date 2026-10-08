import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Location } from './entities/location.entity';
import { LocationsQueryController } from './locations-query.controller';
import { LocationsQueryService } from './locations-query.service';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Company])],
  controllers: [LocationsController, LocationsQueryController],
  providers: [LocationsService, LocationsQueryService],
})
export class LocationsModule {}
