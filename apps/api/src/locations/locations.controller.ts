import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Location } from './entities/location.entity';
import { CreateLocationDto, ListLocationsDto, UpdateLocationDto } from './dto/location.dto';
import { LocationListResult, LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  create(@Body() dto: CreateLocationDto): Promise<Location> {
    return this.locations.create(dto);
  }

  @Get()
  list(@Query() query: ListLocationsDto): Promise<LocationListResult> {
    return this.locations.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Location> {
    return this.locations.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto): Promise<Location> {
    return this.locations.update(id, dto);
  }
}
