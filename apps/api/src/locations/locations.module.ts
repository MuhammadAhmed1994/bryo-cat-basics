import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../companies/entities/company.entity';
import { Location } from './entities/location.entity';
import { LocationsCompanyUsageChecker } from './company-usage.checker';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Company]), CompaniesModule],
  providers: [LocationsService, LocationsCompanyUsageChecker],
  controllers: [LocationsController],
})
export class LocationsModule {}
