import { Controller, Get, Query } from '@nestjs/common';
import { Paginated } from '../common/dto/pagination.dto';
import { Location } from './entities/location.entity';
import { ListLocationsDto } from './dto/list-locations.dto';
import { LocationsQueryService } from './locations-query.service';

@Controller('locations')
export class LocationsQueryController {
  constructor(private readonly locations: LocationsQueryService) {}

  @Get()
  list(@Query() query: ListLocationsDto): Promise<Paginated<Location>> {
    return this.locations.findAll(query);
  }
}
