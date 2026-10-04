process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://nbryo:nbryo@localhost:5433/nbryo_test';
process.env.JWT_SECRET = 'test-secret';
process.env.APP_WEB_URL = 'http://localhost:3000';
