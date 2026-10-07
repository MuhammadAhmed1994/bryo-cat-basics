import { testDatabaseUrl } from './test-database-url';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_SECRET = 'test-secret';
process.env.APP_WEB_URL = 'http://localhost:3000';
