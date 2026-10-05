import 'reflect-metadata';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://nbryo:nbryo@localhost:5433/nbryo_test';
process.env.JWT_SECRET = 'test-secret';
process.env.APP_WEB_URL = 'http://localhost:3000';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { applyGlobals } from '../bootstrap';
import { LocationsModule } from './locations.module';
import { ADMIN_PASSWORD, seedAdmin } from '../../test/helpers';
import { CreateLocations1720000000000 } from '../database/migrations/1720000000000-CreateLocations';
import { Location, LocationStatus } from './entities/location.entity';

test('sanity', () => {
  expect(1 + 1).toBe(2);
});
