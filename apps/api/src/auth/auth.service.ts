import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../users/entities/user.entity';
import { UsersService, normalizeEmail } from '../users/users.service';
import { MAIL_SERVICE, MailService } from '../mail/mail.service';
import { AuthToken, AuthTokenType } from './entities/auth-token.entity';
import { Session } from './entities/session.entity';
import {
  CompleteSignupDto,
  LoginDto,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_MESSAGE,
} from './dto/auth.dto';

const BCRYPT_ROUNDS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Spec 2.1.1.4 — the same message for unknown email and wrong password. */
const BAD_CREDENTIALS = 'Email or password is incorrect. Please try again.';
const INACTIVE_ACCOUNT =
  'Your account is currently inactive. Please contact your administrator.';
const DELETED_ACCOUNT =
  'Your account is currently deleted. Please contact your administrator.';
const EXPIRED_RESET_LINK =
  "Your password reset link has expired. We've sent a new link to your email address. Please check your inbox.";
const EXPIRED_INVITE_LINK =
  'This invitation link is no longer valid. It may have expired or a new invitation may have been sent. Please contact your administrator for a new invitation.';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: UserStatus;
}

export interface LoginResult {
  accessToken: string;
  user: AuthenticatedUser;
}

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    status: user.status,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    @InjectRepository(AuthToken) private readonly tokens: Repository<AuthToken>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @Inject(MAIL_SERVICE) private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  /** Spec 2.1.1.3 — authenticate, check the account is active, then open a session. */
  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.users.findByEmail(normalizeEmail(dto.email));
    if (!user) throw new UnauthorizedException(BAD_CREDENTIALS);

    if (!user.passwordHash) {
      // Invited but never claimed: there is nothing to authenticate against.
      throw new ForbiddenException(
        'Your account setup is not complete. Please use your invitation link.',
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException(BAD_CREDENTIALS);

    this.assertCanSignIn(user);

    user.lastLoginAt = new Date();
    await this.users.save(user);

    return this.issueSession(user);
  }

  /** Spec 2.1.2 — deleting the session row is what makes the old JWT useless. */
  async logout(sessionId: string, userId: string): Promise<void> {
    await this.sessions.delete({ id: sessionId });

    const user = await this.users.findById(userId);
    if (user) {
      user.lastLogoutAt = new Date();
      await this.users.save(user);
    }
  }

  /**
   * Called on every authenticated request. Spec 2.1.3 — a session dies after
   * `sessionInactivityDays` of no use, so each hit refreshes `lastSeenAt`.
   */
  async validateSession(sessionId: string): Promise<AuthenticatedUser> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new UnauthorizedException('Session has ended. Please sign in again.');

    const idleDays = this.config.get<number>('sessionInactivityDays') ?? 90;
    const expiredAt = session.lastSeenAt.getTime() + idleDays * DAY_MS;
    if (Date.now() > expiredAt) {
      await this.sessions.delete({ id: sessionId });
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.sessions.delete({ id: sessionId });
      throw new UnauthorizedException(INACTIVE_ACCOUNT);
    }

    session.lastSeenAt = new Date();
    await this.sessions.save(session);

    return toAuthenticatedUser(user);
  }

  /**
   * Spec 2.1.6.1 — always resolves, whether or not the email is on file, so the
   * screen cannot be used to discover which addresses have accounts.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(normalizeEmail(email));
    if (!user || user.deletedAt) return;

    await this.sendPasswordResetLink(user);
  }

  /** Spec 2.1.6.1 — set the new password, then invalidate every existing session. */
  async resetPassword(rawToken: string, password: string): Promise<void> {
    this.assertPasswordMeetsRequirements(password);

    const token = await this.findToken(rawToken, AuthTokenType.PASSWORD_RESET);

    if (token.expiresAt.getTime() < Date.now()) {
      // Spec 2.1.6.3 — an expired link silently mails a fresh one.
      const owner = await this.users.findById(token.userId);
      if (owner && !owner.deletedAt) await this.sendPasswordResetLink(owner);
      throw new GoneException(EXPIRED_RESET_LINK);
    }

    const user = await this.users.findById(token.userId);
    if (!user || user.deletedAt) throw new BadRequestException(DELETED_ACCOUNT);
    if (user.status === UserStatus.INACTIVE) throw new ForbiddenException(INACTIVE_ACCOUNT);

    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.users.save(user);

    token.consumedAt = new Date();
    await this.tokens.save(token);

    await this.sessions.delete({ userId: user.id });
  }

  /** Spec 2.5.1.1 — mails the invitation and invalidates any earlier link. */
  async sendInvitation(invitee: User, inviter: User): Promise<void> {
    const hours = this.config.get<number>('invitationExpiryHours') ?? 72;
    const raw = await this.issueToken(invitee.id, AuthTokenType.INVITATION, hours);
    const link = `${this.webUrl()}/signup?token=${raw}`;
    await this.mail.sendInvitation(invitee, inviter, link);
  }

  /** Spec 2.5.1.2 — prefills the create-account screen. */
  async getInvitation(
    rawToken: string,
  ): Promise<{ email: string; firstName: string; lastName: string }> {
    const token = await this.findToken(rawToken, AuthTokenType.INVITATION);
    if (token.expiresAt.getTime() < Date.now()) {
      throw new GoneException(EXPIRED_INVITE_LINK);
    }

    const user = await this.users.findById(token.userId);
    if (!user) throw new GoneException(EXPIRED_INVITE_LINK);
    this.assertInviteeCanSignUp(user);

    return { email: user.email, firstName: user.firstName, lastName: user.lastName };
  }

  /** Spec 2.5.1.2 — claim the invite: set the password, go Active, sign in. */
  async completeSignup(dto: CompleteSignupDto): Promise<LoginResult> {
    this.assertPasswordMeetsRequirements(dto.password);

    const token = await this.findToken(dto.token, AuthTokenType.INVITATION);
    if (token.expiresAt.getTime() < Date.now()) {
      throw new GoneException(EXPIRED_INVITE_LINK);
    }

    const user = await this.users.findById(token.userId);
    if (!user) throw new GoneException(EXPIRED_INVITE_LINK);
    this.assertInviteeCanSignUp(user);

    user.firstName = dto.firstName.trim();
    user.lastName = dto.lastName.trim();
    user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    user.status = UserStatus.ACTIVE;
    user.lastLoginAt = new Date();
    await this.users.save(user);

    token.consumedAt = new Date();
    await this.tokens.save(token);

    return this.issueSession(user);
  }

  /** Spec 2.3.2 — change password from the profile screen. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();

    const matches =
      user.passwordHash !== null &&
      (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!matches) throw new BadRequestException('Current password is incorrect.');

    this.assertPasswordMeetsRequirements(newPassword);

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.users.save(user);
  }

  // --- internals -----------------------------------------------------------

  private async issueSession(user: User): Promise<LoginResult> {
    const idleDays = this.config.get<number>('sessionInactivityDays') ?? 90;
    const session = await this.sessions.save(
      this.sessions.create({ userId: user.id, lastSeenAt: new Date() }),
    );

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles: user.roles },
      { jwtid: session.id, expiresIn: `${idleDays}d` },
    );

    return { accessToken, user: toAuthenticatedUser(user) };
  }

  private async sendPasswordResetLink(user: User): Promise<void> {
    const hours = this.config.get<number>('passwordResetExpiryHours') ?? 48;
    const raw = await this.issueToken(user.id, AuthTokenType.PASSWORD_RESET, hours);
    const link = `${this.webUrl()}/reset-password?token=${raw}`;
    await this.mail.sendPasswordReset(user, link);
  }

  /** Issues a fresh single-use token, superseding any outstanding one. */
  private async issueToken(
    userId: string,
    type: AuthTokenType,
    expiryHours: number,
  ): Promise<string> {
    await this.tokens.update(
      { userId, type, consumedAt: IsNull() },
      { invalidatedAt: new Date() },
    );

    const raw = randomBytes(32).toString('hex');
    await this.tokens.save(
      this.tokens.create({
        tokenHash: hashToken(raw),
        type,
        userId,
        expiresAt: new Date(Date.now() + expiryHours * HOUR_MS),
        consumedAt: null,
        invalidatedAt: null,
      }),
    );

    return raw;
  }

  private async findToken(rawToken: string, type: AuthTokenType): Promise<AuthToken> {
    const token = await this.tokens.findOne({
      where: { tokenHash: hashToken(rawToken), type },
    });
    if (!token) {
      throw new BadRequestException(
        type === AuthTokenType.INVITATION ? EXPIRED_INVITE_LINK : EXPIRED_RESET_LINK,
      );
    }
    if (token.consumedAt || token.invalidatedAt) {
      throw new GoneException(
        type === AuthTokenType.INVITATION ? EXPIRED_INVITE_LINK : EXPIRED_RESET_LINK,
      );
    }
    return token;
  }

  private assertCanSignIn(user: User): void {
    if (user.deletedAt) throw new ForbiddenException(DELETED_ACCOUNT);
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException(INACTIVE_ACCOUNT);
  }

  private assertInviteeCanSignUp(user: User): void {
    if (user.deletedAt) throw new ForbiddenException(DELETED_ACCOUNT);
    if (user.status === UserStatus.INACTIVE) throw new ForbiddenException(INACTIVE_ACCOUNT);
  }

  private assertPasswordMeetsRequirements(password: string): void {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(PASSWORD_RULE_MESSAGE);
    }
  }

  private webUrl(): string {
    return this.config.get<string>('webUrl') ?? 'http://localhost:3000';
  }
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
