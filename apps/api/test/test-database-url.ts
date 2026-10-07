const LOCAL_TEST_DATABASE_URL = 'postgres://nbryo:nbryo@localhost:5433/nbryo_test';

/**
 * The database the e2e suite builds, truncates and drops.
 *
 * `TEST_DATABASE_URL` wins. In CI (`CI` set) the runner provides a throwaway
 * database as `DATABASE_URL`, so that is used next. Locally we never fall back
 * to `DATABASE_URL`: it usually points at the dev database, and the global
 * setup drops whatever it is given.
 */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (process.env.CI && process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return LOCAL_TEST_DATABASE_URL;
}
