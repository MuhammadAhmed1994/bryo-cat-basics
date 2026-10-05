import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location } from './entities/location.entity';
import { CompaniesModule } from '../companies/companies.module';
import { LocationsCompanyUsageChecker } from './company-usage.checker';

@Module({
  imports: [TypeOrmModule.forFeature([Location]), CompaniesModule],
  providers: [LocationsService, LocationsCompanyUsageChecker],
  controllers: [LocationsController],
})
export class LocationsModule {}
