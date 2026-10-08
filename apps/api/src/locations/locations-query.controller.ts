import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Paginated } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location } from './entities/location.entity';
import { LocationsQueryService } from './locations-query.service';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsQueryController {
  constructor(private readonly locations: LocationsQueryService) {}

  @Get()
  list(@Query() query: ListLocationsDto): Promise<Paginated<Location>> {
    return this.locations.findAll(query);
  }
}
