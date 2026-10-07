import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  async create(
    @Body() dto: CreateLocationDto,
  ): Promise<Location & { message: string }> {
    const location = await this.locations.create(dto);
    return { ...location, message: 'Location added successfully.' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<Location & { message: string }> {
    const location = await this.locations.update(id, dto);
    return { ...location, message: 'Location updated successfully.' };
  }
}
