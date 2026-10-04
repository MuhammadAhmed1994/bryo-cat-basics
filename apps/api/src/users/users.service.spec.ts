import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './entities/user.entity';

const ACTOR = 'actor-uuid';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-uuid',
    email: 'john.smith@example.com',
    firstName: 'John',
    lastName: 'Smith',
    passwordHash: null,
    roles: [UserRole.LAB_TECH],
    status: UserStatus.INVITED,
    deletedAt: null,
  }, overrides) as User;
}

describe('UsersService', () => {
  let service: UsersService;
  let repo: Record<string, jest.Mock>;
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => Object.assign(new User(), dto)),
      save: jest.fn((e) => Promise.resolve(Object.assign(e, { id: e.id ?? 'new-uuid' }))),
      softRemove: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => qb),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('invite', () => {
    it('creates an Invited user with a lower-cased, trimmed email', async () => {
      repo.findOne.mockResolvedValue(null);

      const user = await service.invite(
        { email: '  John.Smith@Example.com ', firstName: 'John', lastName: 'Smith', roles: [UserRole.ADMIN] },
        ACTOR,
      );

      expect(user.email).toBe('john.smith@example.com');
      expect(user.status).toBe(UserStatus.INVITED);
      expect(user.passwordHash).toBeNull();
      expect(user.createdById).toBe(ACTOR);
    });

    it('rejects a duplicate email even when the existing user is inactive (spec 2.5.1)', async () => {
      repo.findOne.mockResolvedValue(makeUser({ status: UserStatus.INACTIVE }));

      await expect(
        service.invite(
          { email: 'JOHN.SMITH@EXAMPLE.COM', firstName: 'J', lastName: 'S', roles: [UserRole.ADMIN] },
          ACTOR,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('looks up duplicates including soft-deleted users', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.invite(
        { email: 'new@example.com', firstName: 'N', lastName: 'U', roles: [UserRole.ADMIN] },
        ACTOR,
      );

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
        withDeleted: true,
      });
    });

    it('drops tech roles when Admin is selected (spec 2.5.1)', async () => {
      repo.findOne.mockResolvedValue(null);

      const user = await service.invite(
        {
          email: 'a@example.com',
          firstName: 'A',
          lastName: 'B',
          roles: [UserRole.ADMIN, UserRole.FIELD_TECH, UserRole.LAB_TECH],
        },
        ACTOR,
      );

      expect(user.roles).toEqual([UserRole.ADMIN]);
    });

    it('keeps Field Tech and Lab Tech together', async () => {
      repo.findOne.mockResolvedValue(null);

      const user = await service.invite(
        {
          email: 'a@example.com',
          firstName: 'A',
          lastName: 'B',
          roles: [UserRole.FIELD_TECH, UserRole.LAB_TECH],
        },
        ACTOR,
      );

      expect(user.roles).toEqual([UserRole.FIELD_TECH, UserRole.LAB_TECH]);
    });
  });

  describe('findByEmail', () => {
    it('normalizes the email before looking it up', async () => {
      repo.findOne.mockResolvedValue(makeUser());

      await service.findByEmail('  John.Smith@Example.com  ');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'john.smith@example.com' },
      });
    });
  });

  describe('update', () => {
    it('updates names and roles and records the editor', async () => {
      repo.findOne.mockResolvedValue(makeUser());

      const user = await service.update(
        'user-uuid',
        { firstName: 'Jane', roles: [UserRole.ADMIN, UserRole.LAB_TECH] },
        'editor',
      );

      expect(user.firstName).toBe('Jane');
      expect(user.roles).toEqual([UserRole.ADMIN]);
      expect(user.updatedById).toBe('editor');
    });

    it('throws when the user is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('nope', { firstName: 'X' }, 'editor')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('hard deletes an invited user that never logged in (spec 2.5.4)', async () => {
      repo.findOne.mockResolvedValue(makeUser({ status: UserStatus.INVITED, lastLoginAt: null }));

      await service.remove('user-uuid', ACTOR);

      expect(repo.remove).toHaveBeenCalled();
      expect(repo.softRemove).not.toHaveBeenCalled();
    });

    it('soft deletes a user that has logged in before', async () => {
      repo.findOne.mockResolvedValue(
        makeUser({ status: UserStatus.ACTIVE, lastLoginAt: new Date() }),
      );

      await service.remove('user-uuid', ACTOR);

      expect(repo.softRemove).toHaveBeenCalled();
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('refuses to delete an admin (spec 2.5.4)', async () => {
      repo.findOne.mockResolvedValue(makeUser({ roles: [UserRole.ADMIN] }));

      await expect(service.remove('user-uuid', ACTOR)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setActive', () => {
    it('marks a user inactive', async () => {
      repo.findOne.mockResolvedValue(makeUser({ status: UserStatus.ACTIVE }));

      const user = await service.setActive('user-uuid', false, 'editor');

      expect(user.status).toBe(UserStatus.INACTIVE);
    });

    it('does not reactivate an invited user into Active', async () => {
      repo.findOne.mockResolvedValue(makeUser({ status: UserStatus.INVITED }));

      const user = await service.setActive('user-uuid', true, 'editor');

      expect(user.status).toBe(UserStatus.INVITED);
    });
  });

  describe('findAll', () => {
    it('sorts by name A-Z and pages by 50 (spec 2.5.5)', async () => {
      const result = await service.findAll({});

      expect(qb.orderBy).toHaveBeenCalledWith('user.firstName', 'ASC');
      expect(qb.take).toHaveBeenCalledWith(50);
      expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 50 });
    });

    it('searches first and last name case-insensitively', async () => {
      await service.findAll({ search: ' SMI ' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: '%smi%' },
      );
    });
  });
});
