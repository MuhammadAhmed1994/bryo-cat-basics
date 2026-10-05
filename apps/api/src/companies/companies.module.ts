import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { COMPANY_USAGE_CHECKERS } from './company-usage.checker';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), forwardRef(() => LocationsModule)],
  providers: [
    CompaniesService,
    // Modules that reference companies (Locations, Animals, …) push their
    // checkers in here so deletion stays guarded without touching the service.
    { provide: COMPANY_USAGE_CHECKERS, useValue: [] },
  ],
  controllers: [CompaniesController],
  exports: [CompaniesService, COMPANY_USAGE_CHECKERS],
})
export class CompaniesModule {}
