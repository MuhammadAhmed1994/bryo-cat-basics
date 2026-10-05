import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location } from './entities/location.entity';
import {
  LocationCompanyUsageChecker,
  LocationsCompanyUsageRegistrar,
} from './company-usage.checker';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [LocationsService, LocationCompanyUsageChecker, LocationsCompanyUsageRegistrar],
  controllers: [LocationsController],
})
export class LocationsModule {}
