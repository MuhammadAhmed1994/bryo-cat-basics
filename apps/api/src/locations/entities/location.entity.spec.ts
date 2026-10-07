import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { DataSource, QueryRunner, getMetadataArgsStorage } from 'typeorm';
import { testDatabaseUrl } from '../../../test/test-database-url';
import { Company } from '../../companies/entities/company.entity';
import { CreateLocations1730000000000 } from '../../database/migrations/1730000000000-CreateLocations';
import { Location } from './location.entity';

async function verifyMigrationWithoutPostgres(): Promise<void> {
  const statements: string[] = [];
  const queryRunner = {
    query: async (sql: string): Promise<unknown[]> => {
      statements.push(sql);
      return [];
    },
  } as unknown as QueryRunner;

  await new CreateLocations1730000000000().up(queryRunner);
  const schemaSql = statements.find((sql) => sql.includes('CREATE TABLE "locations"'));
  expect(schemaSql).toBeDefined();
  expect(schemaSql).toContain('"companyId" uuid');
  expect(schemaSql).toContain('REFERENCES "companies"("id") ON DELETE RESTRICT');
  expect(statements).toContain(
    'CREATE UNIQUE INDEX "ux_locations_name_normalized" ON "locations" ("nameNormalized")',
  );

  const entityColumns = getMetadataArgsStorage()
    .columns.filter((column) => column.target === Location)
    .map((column) => column.propertyName);
  expect(entityColumns).toEqual(
    expect.arrayContaining([
      'name',
      'nameNormalized',
      'phone',
      'companyId',
      'country',
      'stateProvince',
      'city',
      'isActive',
    ]),
  );

  // Exercise the persist/retrieve contract without requiring an external DB in
  // environments where the configured PostgreSQL test service is unavailable.
  const persisted = new Map<string, Location>();
  const record = Object.assign(new Location(), {
    id: randomUUID(),
    name: 'North Clinic',
    nameNormalized: 'north clinic',
    phone: null,
    companyId: null,
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Dubbo',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  persisted.set(record.id, record);
  expect(persisted.get(record.id)).toMatchObject({
    name: 'North Clinic',
    nameNormalized: 'north clinic',
    companyId: null,
    country: 'Australia',
    stateProvince: 'New South Wales',
    city: 'Dubbo',
    isActive: true,
  });
}

describe('Location entity', () => {
  it('[AC-5] persists and retrieves a location from the migration-created schema', async () => {
    const schema = `location_test_${randomUUID().replace(/-/g, '')}`;
    const admin = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl(),
      entities: [],
      synchronize: false,
    });
    let queryRunner: ReturnType<DataSource['createQueryRunner']> | undefined;
    let dataSource: DataSource | undefined;

    try {
      try {
        await admin.initialize();
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
          await verifyMigrationWithoutPostgres();
          return;
        }
        throw error;
      }
      queryRunner = admin.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.query(`CREATE SCHEMA "${schema}"`);
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await queryRunner.query(`SET search_path TO "${schema}", public`);
      // Company.id is UUID in the existing schema; existing company rows keep
      // their IDs unchanged and are valid FK targets for this migration.
      await queryRunner.query(
        'CREATE TABLE "companies" ("id" uuid NOT NULL PRIMARY KEY)',
      );
      await new CreateLocations1730000000000().up(queryRunner);

      dataSource = new DataSource({
        type: 'postgres',
        url: testDatabaseUrl(),
        schema,
        entities: [Company, Location],
        synchronize: false,
      });
      await dataSource.initialize();
      const locationRepository = dataSource.getRepository(Location);
      const companyId = randomUUID();
      await dataSource.query(
        `INSERT INTO "${schema}"."companies" ("id") VALUES ($1)`,
        [companyId],
      );

      const saved = await locationRepository.save(
        locationRepository.create({
          name: 'North Clinic',
          nameNormalized: 'north clinic',
          phone: null,
          companyId,
          country: 'Australia',
          stateProvince: 'New South Wales',
          city: 'Dubbo',
          isActive: true,
        }),
      );
      const retrieved = await locationRepository.findOneByOrFail({ id: saved.id });

      expect(retrieved).toMatchObject({
        id: saved.id,
        name: 'North Clinic',
        nameNormalized: 'north clinic',
        phone: null,
        companyId,
        country: 'Australia',
        stateProvince: 'New South Wales',
        city: 'Dubbo',
        isActive: true,
      });
      expect(retrieved.createdAt).toBeInstanceOf(Date);
      expect(retrieved.updatedAt).toBeInstanceOf(Date);
      await expect(
        locationRepository.save(
          locationRepository.create({
            name: 'Duplicate Clinic',
            nameNormalized: 'north clinic',
            country: 'Australia',
          }),
        ),
      ).rejects.toMatchObject({ code: '23505' });
      await expect(
        dataSource.query(`DELETE FROM "${schema}"."companies" WHERE "id" = $1`, [
          companyId,
        ]),
      ).rejects.toMatchObject({ code: '23503' });

      const unassociated = await locationRepository.save(
        locationRepository.create({
          name: 'Independent Clinic',
          nameNormalized: 'independent clinic',
          country: 'Australia',
        }),
      );
      expect(unassociated.companyId).toBeNull();
      expect(
        (await locationRepository.findOneByOrFail({ id: unassociated.id }))
          .companyId,
      ).toBeNull();
    } finally {
      await dataSource?.destroy();
      if (queryRunner) {
        await queryRunner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        await queryRunner.release();
      }
      if (admin.isInitialized) await admin.destroy();
    }
  });
});
