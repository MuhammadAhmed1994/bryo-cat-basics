import { getMetadataArgsStorage, QueryRunner } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { CreateLocations1791416106225 } from '../../database/migrations/1791416106225-CreateLocations';
import { Location } from './location.entity';

describe('Location entity', () => {
  it('[AC-11] supports an optional single Company shared by multiple Locations', async () => {
    const metadata = getMetadataArgsStorage();
    const companyIdColumn = metadata.columns.find(
      (column) => column.target === Location && column.propertyName === 'companyId',
    );
    const locationCompany = metadata.relations.find(
      (relation) => relation.target === Location && relation.propertyName === 'company',
    );
    const companyLocations = metadata.relations.find(
      (relation) => relation.target === Company && relation.propertyName === 'locations',
    );

    expect(companyIdColumn?.options.nullable).toBe(true);
    expect(locationCompany?.relationType).toBe('many-to-one');
    expect(locationCompany?.options.nullable).toBe(true);
    expect(companyLocations?.relationType).toBe('one-to-many');

    const executedSql: string[] = [];
    const queryRunner = {
      query: jest.fn(async (sql: string) => {
        executedSql.push(sql);
        return undefined;
      }),
    } as unknown as QueryRunner;
    await new CreateLocations1791416106225().up(queryRunner);

    expect(executedSql).toContain(
      'ALTER TABLE "locations" ADD CONSTRAINT "FK_locations_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
    );
  });
});
