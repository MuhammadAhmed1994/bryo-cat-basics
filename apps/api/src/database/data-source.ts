import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { configuration } from '../config/configuration';
import { User } from '../users/entities/user.entity';
import { AuthToken } from '../auth/entities/auth-token.entity';
import { Session } from '../auth/entities/session.entity';
import { Company } from '../companies/entities/company.entity';
import { Location } from '../locations/entities/location.entity';

// Shared by runtime TypeORM configuration and the migration CLI.
export const ENTITIES = [User, AuthToken, Session, Company, Location];

/** Used by the TypeORM CLI for migrations. */
export default new DataSource({
  type: 'postgres',
  url: configuration().databaseUrl,
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
