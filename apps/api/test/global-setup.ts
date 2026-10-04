import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../src/database/data-source';

/**
 * Builds the test schema exactly once per run, so individual suites never race
 * each other creating the same enum types.
 */
export default async function globalSetup(): Promise<void> {
  const url =
    process.env.TEST_DATABASE_URL ?? 'postgres://nbryo:nbryo@localhost:5433/nbryo_test';

  const dataSource = new DataSource({
    type: 'postgres',
    url,
    entities: ENTITIES,
    synchronize: false,
    dropSchema: false,
  });

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.synchronize();
  await dataSource.destroy();
}
