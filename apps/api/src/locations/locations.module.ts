import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsCompanyUsageChecker } from './company-usage.checker';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from '../companies/company-usage.checker';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Location]), forwardRef(() => CompaniesModule)],
  providers: [
    LocationsService,
    LocationsCompanyUsageChecker,
    {
      provide: 'LOCATIONS_COMPANY_USAGE_REGISTRATION',
      useFactory: (
        list: CompanyUsageChecker[] | null | undefined,
        checker: LocationsCompanyUsageChecker,
      ) => {
        const arr = list ?? [];
        arr.push(checker);
        return true;
      },
      inject: [COMPANY_USAGE_CHECKERS, LocationsCompanyUsageChecker],
    },
  ],
  controllers: [LocationsController],
})
export class LocationsModule {}
