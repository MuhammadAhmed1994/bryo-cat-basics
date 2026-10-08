import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CompaniesService, CompanyDetails } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ListCompaniesDto } from './dto/list-companies.dto';
import { SetActiveDto } from '../common/dto/set-active.dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Company } from './entities/company.entity';
import { Paginated } from '../common/dto/pagination.dto';

/** Spec 2.8 — Companies CRUD. */
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  /** Spec 2.8.1 */
  @Post()
  async create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<Company & { message: string }> {
    const company = await this.companies.create(dto, actor.id);
    return { ...company, message: 'Company added successfully' };
  }

  /** Spec 2.8.7 */
  @Get()
  list(@Query() query: ListCompaniesDto): Promise<Paginated<Company>> {
    return this.companies.findAll(query);
  }

  /** Spec 2.8.2 */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyDetails> {
    return this.companies.findOne(id);
  }

  /** Spec 2.8.3 */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<Company & { message: string }> {
    const company = await this.companies.update(id, dto, actor.id);
    return { ...company, message: 'Company updated successfully.' };
  }

  /** Spec 2.8.5 */
  @Patch(':id/status')
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<Company & { message: string }> {
    const company = await this.companies.setActive(id, dto.isActive, actor.id);
    return {
      ...company,
      message: dto.isActive
        ? 'Company activated successfully.'
        : 'Company deactivated successfully.',
    };
  }

  /** Spec 2.8.4 */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.companies.remove(id);
    return { message: 'Company deleted successfully.' };
  }
}
