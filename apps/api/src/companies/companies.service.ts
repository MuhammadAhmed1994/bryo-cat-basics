import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { Address, Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ListCompaniesDto } from './dto/list-companies.dto';
import { AddressDto } from './dto/company-address.dto';
import { COMPANY_USAGE_CHECKERS, CompanyUsageChecker } from './company-usage.checker';

const EMPTY_ADDRESS: Address = {
  line1: null,
  line2: null,
  country: null,
  state: null,
  city: null,
  postalCode: null,
};

function toAddress(dto?: AddressDto | null): Address {
  return {
    line1: dto?.line1 ?? null,
    line2: dto?.line2 ?? null,
    country: dto?.country ?? null,
    state: dto?.state ?? null,
    city: dto?.city ?? null,
    postalCode: dto?.postalCode ?? null,
  };
}

export function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase();
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @Optional()
    @Inject(COMPANY_USAGE_CHECKERS)
    private readonly usageCheckers: CompanyUsageChecker[] = [],
  ) {}

  /** Spec 2.8.1 — name is unique case-insensitively; new companies are Active. */
  async create(dto: CreateCompanyDto, actorId: string): Promise<Company> {
    const name = dto.name.trim();
    await this.assertNameIsFree(name);

    const billingAddress = toAddress(dto.billingAddress);
    const shippingSameAsBilling = dto.shippingSameAsBilling ?? true;

    const company = this.companies.create({
      name,
      nameNormalized: normalizeCompanyName(name),
      phone: dto.phone.trim(),
      email: dto.email ?? null,
      website: dto.website ?? null,
      billingAddress,
      shippingSameAsBilling,
      shippingAddress: shippingSameAsBilling
        ? { ...billingAddress }
        : toAddress(dto.shippingAddress),
      isActive: true,
      createdById: actorId,
      updatedById: actorId,
    });

    return this.companies.save(company);
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found.');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, actorId: string): Promise<Company> {
    const company = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameIsFree(name, company.id);
      company.name = name;
      company.nameNormalized = normalizeCompanyName(name);
    }
    if (dto.phone !== undefined) company.phone = dto.phone.trim();
    if (dto.email !== undefined) company.email = dto.email ?? null;
    if (dto.website !== undefined) company.website = dto.website ?? null;
    if (dto.billingAddress !== undefined) {
      company.billingAddress = toAddress(dto.billingAddress);
    }
    if (dto.shippingSameAsBilling !== undefined) {
      company.shippingSameAsBilling = dto.shippingSameAsBilling;
    }
    if (company.shippingSameAsBilling) {
      company.shippingAddress = { ...(company.billingAddress ?? EMPTY_ADDRESS) };
    } else if (dto.shippingAddress !== undefined) {
      company.shippingAddress = toAddress(dto.shippingAddress);
    }

    company.updatedById = actorId;
    return this.companies.save(company);
  }

  /** Spec 2.8.4 — blocked while any other record still points at the company. */
  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);

    const counts = await Promise.all(
      (this.usageCheckers ?? []).map((checker) => checker.countForCompany(id)),
    );
    if (counts.some((count) => count > 0)) {
      throw new BadRequestException(
        'This company cannot be deleted because it is being used by existing records.',
      );
    }

    await this.companies.remove(company);
  }

  /** Spec 2.8.5 — toggled from the details screen; history is untouched. */
  async setActive(id: string, isActive: boolean, actorId: string): Promise<Company> {
    const company = await this.findOne(id);
    company.isActive = isActive;
    company.updatedById = actorId;
    return this.companies.save(company);
  }

  /**
   * Spec 2.8.7 — active only by default, name A-Z, case-insensitive partial
   * search that ignores surrounding spaces, optional country filter.
   */
  async findAll(query: ListCompaniesDto): Promise<Paginated<Company>> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.companies.createQueryBuilder('company');

    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere('company.nameNormalized LIKE :search', { search: `%${search}%` });
    }

    const status = query.status ?? 'ACTIVE';
    if (status !== 'ALL') {
      qb.andWhere('company.isActive = :isActive', { isActive: status === 'ACTIVE' });
    }

    if (query.country) {
      qb.andWhere('company.billingAddress.country = :country', {
        country: query.country,
      });
    }

    qb.orderBy('company.name', query.sortDir ?? 'ASC').skip(skip).take(perPage);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }

  private async assertNameIsFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.companies.findOne({
      where: { nameNormalized: normalizeCompanyName(name) },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A company with this name already exists.');
    }
  }
}
