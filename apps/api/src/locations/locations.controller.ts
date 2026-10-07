import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Paginated } from '../common/dto/pagination.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';
import { SetLocationStatusDto } from './dto/set-location-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';

export class GeographicStatesQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country!: string;
}

export class GeographicCitiesQueryDto extends GeographicStatesQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  stateProvince!: string;
}

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  async create(
    @Body() dto: CreateLocationDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<Location & { message: string }> {
    const location = await this.locations.create(dto, actor.id);
    return { ...location, message: 'Location added successfully.' };
  }

  @Get()
  list(@Query() query: ListLocationsDto): Promise<Paginated<Location>> {
    return this.locations.findAll(query);
  }

  @Get('reference/countries')
  getCountries(): string[] {
    return this.locations.getCountries();
  }

  @Get('reference/states')
  getStates(@Query() query: GeographicStatesQueryDto): string[] {
    return this.locations.getStates(query.country);
  }

  @Get('reference/cities')
  getCities(@Query() query: GeographicCitiesQueryDto): string[] {
    return this.locations.getCities(query.country, query.stateProvince);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Location> {
    return this.locations.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<Location & { message: string }> {
    const location = await this.locations.update(id, dto, actor.id);
    return { ...location, message: 'Location updated successfully.' };
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetLocationStatusDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<Location & { message: string }> {
    const location = await this.locations.setStatus(id, dto.isActive, actor.id);
    return {
      ...location,
      message: dto.isActive
        ? 'Location activated successfully.'
        : 'Location deactivated successfully.',
    };
  }
}
