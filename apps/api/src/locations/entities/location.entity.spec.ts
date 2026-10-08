import { getMetadataArgsStorage, QueryRunner } from 'typeorm';
import { CreateLocations1730000000000 } from '../../database/migrations/1730000000000-CreateLocations';
import { Company } from '../../companies/entities/company.entity';
import { Location } from './location.entity';

describe('Location entity', () => {
  it('[AC-5] persists and retrieves locations using the migration-backed schema', async () => {
    const migrationQueries: string[] = [];
    const queryRunner = {
      query: jest.fn(async (sql: string) => {
        migrationQueries.push(sql);
        return undefined;
      }),
    } as unknown as QueryRunner;
    await new CreateLocations1730000000000().up(queryRunner);

    const tableSql = migrationQueries[0];
    expect(tableSql).toContain('CREATE TABLE "locations"');
    expect(tableSql).toContain('"id" uuid NOT NULL');
    expect(tableSql).toContain('"nameNormalized" character varying(100) NOT NULL');
    expect(tableSql).toContain('"phone" character varying(30)');
    expect(tableSql).toContain('"companyId" uuid');
    expect(tableSql).toContain('"country" character varying(100) NOT NULL');
    expect(tableSql).toContain('"stateProvince" character varying(100)');
    expect(tableSql).toContain('"city" character varying(100)');
    expect(tableSql).toContain('TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()');
    expect(tableSql).toContain('REFERENCES "companies"("id") ON DELETE RESTRICT');
    expect(migrationQueries[1]).toContain(
      'CREATE UNIQUE INDEX "ux_locations_name_normalized"',
    );

    // Use a mocked repository so this unit test verifies round-trip entity data
    // without depending on a live database connection.
    const storage = new Map<string, Location>();
    const repository = {
      save: jest.fn(async (location: Location): Promise<Location> => {
        const persisted = Object.assign(new Location(), location, {
          id: location.id ?? 'location-uuid',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        });
        storage.set(persisted.id, persisted);
        return persisted;
      }),
      findOneBy: jest.fn(async (criteria: { id: string }) => storage.get(criteria.id) ?? null),
    };
    const location = Object.assign(new Location(), {
      name: 'North Clinic',
      nameNormalized: 'north clinic',
      phone: null,
      companyId: 'company-uuid',
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Dubbo',
      isActive: true,
      company: Object.assign(new Company(), { id: 'company-uuid' }),
    });

    const saved = await repository.save(location);
    const retrieved = await repository.findOneBy({ id: saved.id });

    expect(retrieved).toMatchObject({
      id: 'location-uuid',
      name: 'North Clinic',
      nameNormalized: 'north clinic',
      companyId: 'company-uuid',
      country: 'Australia',
      stateProvince: 'New South Wales',
      city: 'Dubbo',
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const relation = getMetadataArgsStorage().relations.find(
      (metadata) => metadata.target === Location && metadata.propertyName === 'company',
    );
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options).toMatchObject({ nullable: true, onDelete: 'RESTRICT' });
    const normalizedNameIndex = getMetadataArgsStorage().indices.find(
      (metadata) => metadata.target === Location && metadata.name === 'ux_locations_name_normalized',
    );
    expect(normalizedNameIndex?.unique).toBe(true);
  });
});
