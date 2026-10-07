import { getMetadataArgsStorage } from 'typeorm';
import { CreateLocations1791416106225 } from '../../database/migrations/1791416106225-CreateLocations';
import { Company } from '../../companies/entities/company.entity';
import { Location } from './location.entity';
import { LocationStatus } from './location-status.enum';

describe('Location entity', () => {
  it('[AC-11] persists locations with one nullable Company association shared by many locations', async () => {
    const metadata = getMetadataArgsStorage();
    const companyRelation = metadata.relations.find(
      (relation) => relation.target === Location && relation.propertyName === 'company',
    );
    const locationsRelation = metadata.relations.find(
      (relation) => relation.target === Company && relation.propertyName === 'locations',
    );
    const migration = new CreateLocations1791416106225();
    const statements: string[] = [];
    const queryRunner = {
      query: async (sql: string): Promise<void> => {
        statements.push(sql);
      },
    };

    await migration.up(queryRunner as never);

    const createTable = statements.find((sql) => sql.includes('CREATE TABLE "locations"'));
    const foreignKey = statements.find((sql) => sql.includes('FOREIGN KEY ("company_id")'));

    expect(companyRelation?.relationType).toBe('many-to-one');
    expect(companyRelation?.options?.nullable).toBe(true);
    expect(locationsRelation?.relationType).toBe('one-to-many');
    expect(createTable).toContain('"company_id" uuid');
    expect(foreignKey).toContain('REFERENCES "companies"("id")');
    expect(foreignKey).toContain('ON DELETE SET NULL');
    expect(foreignKey).not.toContain('UNIQUE');
    expect(LocationStatus.ACTIVE).toBe('ACTIVE');
  });
});
