import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, resolvePaging } from '../common/dto/pagination.dto';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Spec 2.5.1 — Admin is exclusive: picking it clears the tech roles. Field Tech
 * and Lab Tech may be held together.
 */
export function normalizeRoles(roles: UserRole[]): UserRole[] {
  const unique = Array.from(new Set(roles));
  if (unique.includes(UserRole.ADMIN)) return [UserRole.ADMIN];
  return [UserRole.FIELD_TECH, UserRole.LAB_TECH].filter((r) => unique.includes(r));
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async invite(dto: InviteUserDto, actorId: string): Promise<User> {
    const email = normalizeEmail(dto.email);

    // Spec 2.5.1 — uniqueness spans active, inactive and soft-deleted accounts.
    const existing = await this.users.findOne({ where: { email }, withDeleted: true });
    if (existing) {
      throw new ConflictException('A user with this email address already exists.');
    }

    const user = this.users.create({
      email,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      roles: normalizeRoles(dto.roles),
      status: UserStatus.INVITED,
      passwordHash: null,
      createdById: actorId,
      updatedById: actorId,
    });

    return this.users.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: normalizeEmail(email) } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  save(user: User): Promise<User> {
    return this.users.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<User> {
    const user = await this.findOne(id);

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.roles !== undefined) user.roles = normalizeRoles(dto.roles);
    user.updatedById = actorId;

    return this.users.save(user);
  }

  /**
   * Spec 2.5.4 — an account that was never used is purged; anything with
   * history is soft deleted so audit trails keep naming the user.
   */
  async remove(id: string, actorId: string): Promise<void> {
    const user = await this.findOne(id);

    if (user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Admin users cannot be deleted.');
    }

    user.updatedById = actorId;
    const neverUsed = user.status === UserStatus.INVITED && user.lastLoginAt === null;
    if (neverUsed) {
      await this.users.remove(user);
    } else {
      await this.users.softRemove(user);
    }
  }

  /** Spec 2.5.6 — an invited user stays Invited until they claim the account. */
  async setActive(id: string, active: boolean, actorId: string): Promise<User> {
    const user = await this.findOne(id);
    user.updatedById = actorId;

    if (!active) {
      user.status = UserStatus.INACTIVE;
    } else if (user.status !== UserStatus.INVITED) {
      user.status = UserStatus.ACTIVE;
    }

    return this.users.save(user);
  }

  /** Spec 2.5.5 — default sort Name A-Z, case-insensitive partial name search. */
  async findAll(query: ListUsersDto): Promise<Paginated<User>> {
    const { page, perPage, skip } = resolvePaging(query.page, query.perPage);
    const qb = this.users.createQueryBuilder('user');

    const search = query.search?.trim().toLowerCase();
    if (search) {
      qb.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (query.status && query.status !== 'ALL') {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    qb.orderBy('user.firstName', query.sortDir ?? 'ASC')
      .addOrderBy('user.lastName', query.sortDir ?? 'ASC')
      .skip(skip)
      .take(perPage);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, perPage };
  }
}
