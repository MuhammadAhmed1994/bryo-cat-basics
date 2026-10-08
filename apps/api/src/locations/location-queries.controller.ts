import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Paginated } from '../common/dto/pagination.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { Location } from './entities/location.entity';
import { LocationQueriesService } from './location-queries.service';

@Controller('locations')
export class LocationQueriesController {
  constructor(private readonly locations: LocationQueriesService) {}

  @Get()
  list(@Query() query: ListLocationsDto): Promise<Paginated<Location>> {
    return this.locations.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Location> {
    return this.locations.findOne(id);
  }
}
