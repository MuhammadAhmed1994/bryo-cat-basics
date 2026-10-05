import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { LocationsCompanyUsageChecker } from './company-usage.checker';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [LocationsService, LocationsCompanyUsageChecker],
  controllers: [LocationsController],
  exports: [LocationsService],
})
export class LocationsModule {}
