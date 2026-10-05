import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { registerLocationsCompanyUsageChecker } from './company-usage.checker';

@Module({
  imports: [TypeOrmModule.forFeature([Location]), CompaniesModule],
  controllers: [LocationsController],
  providers: [LocationsService, registerLocationsCompanyUsageChecker],
})
export class LocationsModule {}
