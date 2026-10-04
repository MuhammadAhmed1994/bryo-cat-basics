import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

/**
 * Creates the first Active admin. Everyone else is invited through the app
 * (spec 2.5.1), so this only needs to bootstrap one account.
 */
async function seed(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@nbryo.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  await dataSource.initialize();
  const users = dataSource.getRepository(User);

  const existing = await users.findOne({ where: { email }, withDeleted: true });
  if (existing) {
    console.log(`Admin ${email} already exists — nothing to do.`);
    await dataSource.destroy();
    return;
  }

  await users.save(
    users.create({
      email,
      firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Platform',
      lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Admin',
      passwordHash: await bcrypt.hash(password, 10),
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
    }),
  );

  console.log(`Seeded admin ${email} with password: ${password}`);
  console.log('Change this password after first login.');
  await dataSource.destroy();
}

void seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
