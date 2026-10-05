import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  create(@Body() dto: CreateLocationDto, @CurrentUser() actor: RequestUser) {
    return this.locations.create(dto, actor.id);
  }

  @Get()
  list(@Query() query: ListLocationsDto) {
    return this.locations.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.locations.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.locations.update(id, dto, actor.id);
  }
}
