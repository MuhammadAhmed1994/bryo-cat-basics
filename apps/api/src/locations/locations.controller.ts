import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { CreateLocationDto } from './dto/create-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  async create(@Body() dto: CreateLocationDto, @CurrentUser() actor: RequestUser) {
    const location = await this.locations.create(dto, actor.id);
    return { ...location, message: 'Location added successfully' };
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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const location = await this.locations.update(id, dto, actor.id);
    return { ...location, message: 'Location updated successfully' };
  }
}
