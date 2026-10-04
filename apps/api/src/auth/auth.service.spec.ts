import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthToken, AuthTokenType } from './entities/auth-token.entity';
import { Session } from './entities/session.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { MAIL_SERVICE, MailService } from '../mail/mail.service';

const PASSWORD = 'Sup3rSecret!';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-uuid',
    email: 'john.smith@example.com',
    firstName: 'John',
    lastName: 'Smith',
    passwordHash: bcrypt.hashSync(PASSWORD, 4),
    roles: [UserRole.ADMIN],
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    lastLogoutAt: null,
    deletedAt: null,
  }, overrides) as User;
}

describe('AuthService', () => {
  let service: AuthService;
  let users: { findByEmail: jest.Mock; findById: jest.Mock; save: jest.Mock };
  let tokens: Record<string, jest.Mock>;
  let sessions: Record<string, jest.Mock>;
  let mail: jest.Mocked<MailService>;

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, unknown> = {
        'jwt.secret': 'test-secret',
        sessionInactivityDays: 90,
        passwordResetExpiryHours: 48,
        invitationExpiryHours: 72,
        webUrl: 'http://localhost:3000',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn((u) => Promise.resolve(u)),
    };
    tokens = {
      findOne: jest.fn(),
      create: jest.fn((dto) => Object.assign(new AuthToken(), dto)),
      save: jest.fn((e) => Promise.resolve(Object.assign(e, { id: e.id ?? 'token-uuid' }))),
      update: jest.fn().mockResolvedValue(undefined),
    };
    sessions = {
      findOne: jest.fn(),
      create: jest.fn((dto) => Object.assign(new Session(), dto)),
      save: jest.fn((e) => Promise.resolve(Object.assign(e, { id: e.id ?? 'session-uuid' }))),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    mail = {
      sendInvitation: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MailService>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: getRepositoryToken(AuthToken), useValue: tokens },
        { provide: getRepositoryToken(Session), useValue: sessions },
        { provide: MAIL_SERVICE, useValue: mail },
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('returns an access token for an active user', async () => {
      const user = makeUser();
      users.findByEmail.mockResolvedValue(user);

      const result = await service.login({ email: 'john.smith@example.com', password: PASSWORD });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe('john.smith@example.com');
      expect(sessions.save).toHaveBeenCalled();
    });

    it('records the login timestamp (spec 2.1.5)', async () => {
      const user = makeUser();
      users.findByEmail.mockResolvedValue(user);

      await service.login({ email: 'john.smith@example.com', password: PASSWORD });

      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(users.save).toHaveBeenCalledWith(user);
    });

    it('accepts an email in any case, with surrounding spaces', async () => {
      users.findByEmail.mockResolvedValue(makeUser());

      await service.login({ email: '  John.Smith@Example.com  ', password: PASSWORD });

      expect(users.findByEmail).toHaveBeenCalledWith('john.smith@example.com');
    });

    it('rejects an unknown email with the generic message (spec 2.1.1.4)', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: PASSWORD }),
      ).rejects.toThrow('Email or password is incorrect. Please try again.');
    });

    it('rejects a wrong password with the same generic message', async () => {
      users.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.login({ email: 'john.smith@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('blocks an inactive account with its own message (spec 2.1.1.5)', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ status: UserStatus.INACTIVE }));

      await expect(
        service.login({ email: 'john.smith@example.com', password: PASSWORD }),
      ).rejects.toThrow('Your account is currently inactive. Please contact your administrator.');
    });

    it('blocks an invited account that has not set a password yet', async () => {
      users.findByEmail.mockResolvedValue(
        makeUser({ status: UserStatus.INVITED, passwordHash: null }),
      );

      await expect(
        service.login({ email: 'john.smith@example.com', password: PASSWORD }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('deletes the session and stamps the logout time', async () => {
      const user = makeUser();
      users.findById.mockResolvedValue(user);

      await service.logout('session-uuid', user.id);

      expect(sessions.delete).toHaveBeenCalledWith({ id: 'session-uuid' });
      expect(user.lastLogoutAt).toBeInstanceOf(Date);
    });
  });

  describe('validateSession', () => {
    it('rejects a session that no longer exists (logged out)', async () => {
      sessions.findOne.mockResolvedValue(null);

      await expect(service.validateSession('session-uuid')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects and deletes a session idle for more than 90 days (spec 2.1.3)', async () => {
      const idle = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      sessions.findOne.mockResolvedValue(
        Object.assign(new Session(), { id: 'session-uuid', userId: 'user-uuid', lastSeenAt: idle }),
      );
      users.findById.mockResolvedValue(makeUser());

      await expect(service.validateSession('session-uuid')).rejects.toThrow(UnauthorizedException);
      expect(sessions.delete).toHaveBeenCalledWith({ id: 'session-uuid' });
    });

    it('refreshes lastSeenAt for an active session', async () => {
      const session = Object.assign(new Session(), {
        id: 'session-uuid',
        userId: 'user-uuid',
        lastSeenAt: new Date(Date.now() - 60 * 60 * 1000),
      });
      sessions.findOne.mockResolvedValue(session);
      users.findById.mockResolvedValue(makeUser());

      const user = await service.validateSession('session-uuid');

      expect(user.id).toBe('user-uuid');
      expect(sessions.save).toHaveBeenCalled();
    });

    it('rejects the session of a user who was deactivated mid-session', async () => {
      sessions.findOne.mockResolvedValue(
        Object.assign(new Session(), {
          id: 'session-uuid',
          userId: 'user-uuid',
          lastSeenAt: new Date(),
        }),
      );
      users.findById.mockResolvedValue(makeUser({ status: UserStatus.INACTIVE }));

      await expect(service.validateSession('session-uuid')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('issues a token and emails the reset link', async () => {
      users.findByEmail.mockResolvedValue(makeUser());

      await service.requestPasswordReset('john.smith@example.com');

      expect(tokens.save).toHaveBeenCalled();
      expect(mail.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'john.smith@example.com' }),
        expect.stringContaining('/reset-password?token='),
      );
    });

    it('invalidates previously issued reset tokens (spec 2.1.6.3)', async () => {
      users.findByEmail.mockResolvedValue(makeUser());

      await service.requestPasswordReset('john.smith@example.com');

      expect(tokens.update).toHaveBeenCalledWith(
        { userId: 'user-uuid', type: AuthTokenType.PASSWORD_RESET, consumedAt: IsNull() },
        expect.objectContaining({ invalidatedAt: expect.any(Date) }),
      );
    });

    it('stays silent about unknown emails so accounts cannot be enumerated', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.requestPasswordReset('nobody@example.com')).resolves.toBeUndefined();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('sets the new password and consumes the token', async () => {
      const user = makeUser();
      const token = Object.assign(new AuthToken(), {
        id: 'token-uuid',
        userId: user.id,
        type: AuthTokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 3600_000),
        consumedAt: null,
        invalidatedAt: null,
      });
      tokens.findOne.mockResolvedValue(token);
      users.findById.mockResolvedValue(user);

      await service.resetPassword('raw-token', 'NewPassw0rd!');

      expect(bcrypt.compareSync('NewPassw0rd!', user.passwordHash!)).toBe(true);
      expect(token.consumedAt).toBeInstanceOf(Date);
    });

    it('ends all sessions so old logins stop working', async () => {
      const user = makeUser();
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          expiresAt: new Date(Date.now() + 3600_000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );
      users.findById.mockResolvedValue(user);

      await service.resetPassword('raw-token', 'NewPassw0rd!');

      expect(sessions.delete).toHaveBeenCalledWith({ userId: user.id });
    });

    it('rejects a password shorter than 8 characters (spec 2.1.7)', async () => {
      await expect(service.resetPassword('raw-token', 'short')).rejects.toThrow(
        'Password must contain at least 8 characters.',
      );
    });

    it('re-issues a link and reports expiry when the token has expired (spec 2.1.6.3)', async () => {
      const user = makeUser();
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          expiresAt: new Date(Date.now() - 1000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );
      users.findById.mockResolvedValue(user);
      users.findByEmail.mockResolvedValue(user);

      await expect(service.resetPassword('raw-token', 'NewPassw0rd!')).rejects.toThrow(
        GoneException,
      );
      expect(mail.sendPasswordReset).toHaveBeenCalled();
    });

    it('rejects an unknown token', async () => {
      tokens.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('bogus', 'NewPassw0rd!')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('inviteLink', () => {
    it('issues an invitation token and emails it', async () => {
      const invitee = makeUser({ status: UserStatus.INVITED, passwordHash: null });
      const inviter = makeUser({ id: 'admin-uuid', firstName: 'Ada', lastName: 'Admin' });

      await service.sendInvitation(invitee, inviter);

      expect(mail.sendInvitation).toHaveBeenCalledWith(
        invitee,
        inviter,
        expect.stringContaining('/signup?token='),
      );
    });

    it('invalidates earlier invitations so only the latest link works (spec 2.5.1.1)', async () => {
      const invitee = makeUser({ status: UserStatus.INVITED, passwordHash: null });

      await service.sendInvitation(invitee, makeUser({ id: 'admin-uuid' }));

      expect(tokens.update).toHaveBeenCalledWith(
        { userId: invitee.id, type: AuthTokenType.INVITATION, consumedAt: IsNull() },
        expect.objectContaining({ invalidatedAt: expect.any(Date) }),
      );
    });
  });

  describe('getInvitation', () => {
    it('returns the invitee email so the signup screen can prefill it', async () => {
      const user = makeUser({ status: UserStatus.INVITED, passwordHash: null });
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: user.id,
          type: AuthTokenType.INVITATION,
          expiresAt: new Date(Date.now() + 3600_000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );
      users.findById.mockResolvedValue(user);

      const result = await service.getInvitation('raw-token');

      expect(result).toEqual({
        email: 'john.smith@example.com',
        firstName: 'John',
        lastName: 'Smith',
      });
    });

    it('rejects an expired invitation (spec 2.5.1.2)', async () => {
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: 'user-uuid',
          type: AuthTokenType.INVITATION,
          expiresAt: new Date(Date.now() - 1000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );

      await expect(service.getInvitation('raw-token')).rejects.toThrow(GoneException);
    });

    it('rejects an invitation superseded by a newer one', async () => {
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: 'user-uuid',
          type: AuthTokenType.INVITATION,
          expiresAt: new Date(Date.now() + 3600_000),
          consumedAt: null,
          invalidatedAt: new Date(),
        }),
      );

      await expect(service.getInvitation('raw-token')).rejects.toThrow(GoneException);
    });
  });

  describe('completeSignup', () => {
    it('sets the password, activates the account and logs the user in (spec 2.5.1.2)', async () => {
      const user = makeUser({ status: UserStatus.INVITED, passwordHash: null });
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: user.id,
          type: AuthTokenType.INVITATION,
          expiresAt: new Date(Date.now() + 3600_000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );
      users.findById.mockResolvedValue(user);

      const result = await service.completeSignup({
        token: 'raw-token',
        firstName: 'Johnny',
        lastName: 'Smith',
        password: 'NewPassw0rd!',
      });

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.firstName).toBe('Johnny');
      expect(bcrypt.compareSync('NewPassw0rd!', user.passwordHash!)).toBe(true);
      expect(result.accessToken).toBe('jwt-token');
    });

    it('refuses signup for an account deactivated before it was claimed', async () => {
      const user = makeUser({ status: UserStatus.INACTIVE, passwordHash: null });
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: user.id,
          type: AuthTokenType.INVITATION,
          expiresAt: new Date(Date.now() + 3600_000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );
      users.findById.mockResolvedValue(user);

      await expect(
        service.completeSignup({
          token: 'raw-token',
          firstName: 'J',
          lastName: 'S',
          password: 'NewPassw0rd!',
        }),
      ).rejects.toThrow('Your account is currently inactive. Please contact your administrator.');
    });

    it('refuses signup for a deleted account', async () => {
      const user = makeUser({ status: UserStatus.INVITED, passwordHash: null, deletedAt: new Date() });
      tokens.findOne.mockResolvedValue(
        Object.assign(new AuthToken(), {
          userId: user.id,
          type: AuthTokenType.INVITATION,
          expiresAt: new Date(Date.now() + 3600_000),
          consumedAt: null,
          invalidatedAt: null,
        }),
      );
      users.findById.mockResolvedValue(user);

      await expect(
        service.completeSignup({
          token: 'raw-token',
          firstName: 'J',
          lastName: 'S',
          password: 'NewPassw0rd!',
        }),
      ).rejects.toThrow('Your account is currently deleted. Please contact your administrator.');
    });
  });

  describe('changePassword', () => {
    it('changes the password when the current one is right (spec 2.3.2)', async () => {
      const user = makeUser();
      users.findById.mockResolvedValue(user);

      await service.changePassword(user.id, PASSWORD, 'NewPassw0rd!');

      expect(bcrypt.compareSync('NewPassw0rd!', user.passwordHash!)).toBe(true);
    });

    it('rejects a wrong current password with the spec message', async () => {
      users.findById.mockResolvedValue(makeUser());

      await expect(
        service.changePassword('user-uuid', 'not-my-password', 'NewPassw0rd!'),
      ).rejects.toThrow('Current password is incorrect.');
    });

    it('enforces the 8 character minimum on the new password', async () => {
      users.findById.mockResolvedValue(makeUser());

      await expect(service.changePassword('user-uuid', PASSWORD, 'short')).rejects.toThrow(
        'Password must contain at least 8 characters.',
      );
    });
  });
});
