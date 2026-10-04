import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {
  ADMIN_PASSWORD,
  createTestApp,
  resetDatabase,
  seedAdmin,
  tokenFromLastMail,
} from './helpers';
import { User, UserRole, UserStatus } from '../src/users/entities/user.entity';
import { ConsoleMailService } from '../src/mail/mail.service';

describe('Auth & signup (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let mail: ConsoleMailService;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    dataSource = ctx.dataSource;
    mail = ctx.mail;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    mail.outbox.length = 0;
  });

  const api = () => request(app.getHttpServer());

  describe('POST /api/auth/login', () => {
    it('signs in an active user and returns a token', async () => {
      await seedAdmin(dataSource);

      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'ADMIN@NBRYO.TEST', password: ADMIN_PASSWORD })
        .expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: 'admin@nbryo.test',
        roles: [UserRole.ADMIN],
      });
    });

    it('returns the generic message for a wrong password (spec 2.1.1.4)', async () => {
      await seedAdmin(dataSource);

      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'admin@nbryo.test', password: 'nope-not-it' })
        .expect(401);

      expect(res.body.message).toBe('Email or password is incorrect. Please try again.');
    });

    it('rejects an invalid email format (spec 2.1.1.4)', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'john@', password: ADMIN_PASSWORD })
        .expect(400);

      expect(res.body.message).toContain('Enter a valid email address');
    });

    it('blocks an inactive account (spec 2.1.1.5)', async () => {
      await seedAdmin(dataSource, { status: UserStatus.INACTIVE });

      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'admin@nbryo.test', password: ADMIN_PASSWORD })
        .expect(403);

      expect(res.body.message).toBe(
        'Your account is currently inactive. Please contact your administrator.',
      );
    });
  });

  describe('protected routes', () => {
    it('rejects a request with no token (spec 2.1.4)', async () => {
      await api().get('/api/auth/me').expect(401);
    });

    it('returns the current user with a valid token', async () => {
      await seedAdmin(dataSource);
      const token = await login();

      const res = await api()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe('admin@nbryo.test');
    });

    it('stops accepting the token after logout (spec 2.1.2)', async () => {
      await seedAdmin(dataSource);
      const token = await login();

      await api().post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
      await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    });
  });

  describe('invite -> signup flow (spec 2.5.1)', () => {
    it('invites a user, mails a link, and lets them create their account', async () => {
      await seedAdmin(dataSource);
      const adminToken = await login();

      const invited = await api()
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Field',
          lastName: 'Tech',
          email: 'Field.Tech@Example.com',
          roles: [UserRole.FIELD_TECH],
        })
        .expect(201);

      expect(invited.body).toMatchObject({
        email: 'field.tech@example.com',
        status: UserStatus.INVITED,
      });
      expect(mail.outbox[0].subject).toBe(
        'Nbryo has invited you to join Cattlytics IVF.',
      );

      const token = tokenFromLastMail(mail);

      const invitation = await api()
        .get(`/api/auth/invitation?token=${token}`)
        .expect(200);
      expect(invitation.body).toEqual({
        email: 'field.tech@example.com',
        firstName: 'Field',
        lastName: 'Tech',
      });

      const signup = await api()
        .post('/api/auth/signup')
        .send({
          token,
          firstName: 'Fiona',
          lastName: 'Tech',
          password: 'Str0ngPassword!',
        })
        .expect(201);

      expect(signup.body.message).toBe('Your account has been created successfully.');
      expect(signup.body.user.status).toBe(UserStatus.ACTIVE);
      expect(signup.body.accessToken).toEqual(expect.any(String));

      // The new user can sign in with the password they just chose.
      await api()
        .post('/api/auth/login')
        .send({ email: 'field.tech@example.com', password: 'Str0ngPassword!' })
        .expect(200);
    });

    it('rejects a duplicate email case-insensitively (spec 2.5.1)', async () => {
      await seedAdmin(dataSource);
      const adminToken = await login();

      const res = await api()
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Ada',
          lastName: 'Clone',
          email: 'Admin@Nbryo.TEST',
          roles: [UserRole.LAB_TECH],
        })
        .expect(409);

      expect(res.body.message).toBe('A user with this email address already exists.');
    });

    it('invalidates the first invitation when a new one is sent (spec 2.5.1.1)', async () => {
      await seedAdmin(dataSource);
      const adminToken = await login();

      const invited = await api()
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Lab',
          lastName: 'Tech',
          email: 'lab.tech@example.com',
          roles: [UserRole.LAB_TECH],
        })
        .expect(201);
      const firstToken = tokenFromLastMail(mail);

      await api()
        .post(`/api/users/${invited.body.id}/resend-invite`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(202);
      const secondToken = tokenFromLastMail(mail);

      expect(secondToken).not.toBe(firstToken);
      await api().get(`/api/auth/invitation?token=${firstToken}`).expect(410);
      await api().get(`/api/auth/invitation?token=${secondToken}`).expect(200);
    });

    it('rejects a password under 8 characters (spec 2.1.7)', async () => {
      await seedAdmin(dataSource);
      const adminToken = await login();

      await api()
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Short',
          lastName: 'Pass',
          email: 'short@example.com',
          roles: [UserRole.LAB_TECH],
        })
        .expect(201);

      const res = await api()
        .post('/api/auth/signup')
        .send({
          token: tokenFromLastMail(mail),
          firstName: 'Short',
          lastName: 'Pass',
          password: 'short',
        })
        .expect(400);

      expect(res.body.message).toContain('Password must contain at least 8 characters.');
    });

    it('refuses non-admins access to user administration', async () => {
      await seedAdmin(dataSource, {
        email: 'tech@nbryo.test',
        roles: [UserRole.LAB_TECH],
      });
      const token = await login('tech@nbryo.test');

      await api().get('/api/users').set('Authorization', `Bearer ${token}`).expect(403);
    });
  });

  describe('forgot / reset password (spec 2.1.6)', () => {
    it('mails a reset link and accepts the new password', async () => {
      await seedAdmin(dataSource);

      const res = await api()
        .post('/api/auth/forgot-password')
        .send({ email: 'admin@nbryo.test' })
        .expect(202);
      expect(res.body.message).toBe(
        'We have sent you an email with instructions to reset your password.',
      );
      expect(mail.outbox[0].subject).toBe('Reset your password!');

      const reset = await api()
        .post('/api/auth/reset-password')
        .send({ token: tokenFromLastMail(mail), password: 'BrandNewPass1!' })
        .expect(200);
      expect(reset.body.message).toBe('Your password has been reset successfully.');

      await api()
        .post('/api/auth/login')
        .send({ email: 'admin@nbryo.test', password: 'BrandNewPass1!' })
        .expect(200);
      await api()
        .post('/api/auth/login')
        .send({ email: 'admin@nbryo.test', password: ADMIN_PASSWORD })
        .expect(401);
    });

    it('answers 202 for an unknown email without sending mail', async () => {
      await api()
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(202);

      expect(mail.outbox).toHaveLength(0);
    });

    it('ends existing sessions after a reset', async () => {
      await seedAdmin(dataSource);
      const token = await login();

      await api().post('/api/auth/forgot-password').send({ email: 'admin@nbryo.test' });
      await api()
        .post('/api/auth/reset-password')
        .send({ token: tokenFromLastMail(mail), password: 'BrandNewPass1!' })
        .expect(200);

      await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    });

    it('issues a fresh link when an expired one is used (spec 2.1.6.3)', async () => {
      const admin = await seedAdmin(dataSource);
      await api().post('/api/auth/forgot-password').send({ email: admin.email });
      const expiredToken = tokenFromLastMail(mail);

      await dataSource.query(
        `UPDATE auth_tokens SET "expiresAt" = now() - interval '1 hour' WHERE "userId" = $1`,
        [admin.id],
      );
      mail.outbox.length = 0;

      const res = await api()
        .post('/api/auth/reset-password')
        .send({ token: expiredToken, password: 'BrandNewPass1!' })
        .expect(410);

      expect(res.body.message).toBe(
        "Your password reset link has expired. We've sent a new link to your email address. Please check your inbox.",
      );
      expect(mail.outbox).toHaveLength(1);

      // The freshly mailed link works.
      await api()
        .post('/api/auth/reset-password')
        .send({ token: tokenFromLastMail(mail), password: 'BrandNewPass1!' })
        .expect(200);
    });
  });

  describe('change password (spec 2.3.2)', () => {
    it('changes the password for the signed-in user', async () => {
      await seedAdmin(dataSource);
      const token = await login();

      const res = await api()
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: ADMIN_PASSWORD, newPassword: 'Ch4ngedPass!' })
        .expect(200);

      expect(res.body.message).toBe('Your password has been changed successfully.');
      await api()
        .post('/api/auth/login')
        .send({ email: 'admin@nbryo.test', password: 'Ch4ngedPass!' })
        .expect(200);
    });

    it('rejects a wrong current password', async () => {
      await seedAdmin(dataSource);
      const token = await login();

      const res = await api()
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'not-mine', newPassword: 'Ch4ngedPass!' })
        .expect(400);

      expect(res.body.message).toBe('Current password is incorrect.');
    });
  });

  async function login(email = 'admin@nbryo.test', password = ADMIN_PASSWORD) {
    const res = await api().post('/api/auth/login').send({ email, password }).expect(200);
    return res.body.accessToken as string;
  }
});
