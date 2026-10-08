import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationCompanyUsageChecker, LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Company])],
  controllers: [LocationsController],
  providers: [LocationsService, LocationCompanyUsageChecker],
  exports: [LocationsService, LocationCompanyUsageChecker],
})
export class LocationsModule {}
