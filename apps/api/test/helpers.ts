import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { applyGlobals } from '../src/bootstrap';
import { User, UserRole, UserStatus } from '../src/users/entities/user.entity';
import { ConsoleMailService } from '../src/mail/mail.service';

export const ADMIN_PASSWORD = 'Adm1nPassword!';

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
  mail: ConsoleMailService;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  applyGlobals(app);
  await app.init();

  return {
    app,
    dataSource: app.get(DataSource),
    mail: app.get(ConsoleMailService),
  };
}

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE "sessions", "auth_tokens", "companies", "users" CASCADE',
  );
}

/** Seeds an Active admin so protected endpoints can be exercised. */
export async function seedAdmin(
  dataSource: DataSource,
  overrides: Partial<User> = {},
): Promise<User> {
  const repo = dataSource.getRepository(User);
  return repo.save(
    repo.create({
      email: 'admin@nbryo.test',
      firstName: 'Ada',
      lastName: 'Admin',
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 4),
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
      ...overrides,
    }),
  );
}

/** Pulls the one-time token out of the most recent email in the outbox. */
export function tokenFromLastMail(mail: ConsoleMailService): string {
  const last = mail.outbox[mail.outbox.length - 1];
  if (!last) throw new Error('No mail was sent');
  const match = last.body.match(/token=([a-f0-9]{64})/);
  if (!match) throw new Error(`No token in mail body:\n${last.body}`);
  return match[1];
}
