import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';

export type LocationMutationResponse = Location & {
  message: string;
  redirectTo: string;
};

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  async create(
    @Body() dto: CreateLocationDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<LocationMutationResponse> {
    const location = await this.locations.create(dto, actor.id);
    return {
      ...location,
      message: 'Location added successfully.',
      redirectTo: '/locations',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<LocationMutationResponse> {
    const location = await this.locations.update(id, dto, actor.id);
    return {
      ...location,
      message: 'Location updated successfully.',
      redirectTo: `/locations/${location.id}`,
    };
  }
}
