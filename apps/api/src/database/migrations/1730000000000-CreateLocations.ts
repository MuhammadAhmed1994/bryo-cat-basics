import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocations1730000000000 implements MigrationInterface {
  name = 'CreateLocations1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The existing companies.id is a UUID primary key (InitialSchema migration).
    // Reference it directly so existing company rows need no key rewrite/backfill.
    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdById" uuid,
        "updatedById" uuid,
        "name" character varying(100) NOT NULL,
        "nameNormalized" character varying(100) NOT NULL,
        "phone" character varying(30),
        "companyId" uuid,
        "country" character varying(100) NOT NULL,
        "stateProvince" character varying(100),
        "city" character varying(100),
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_locations_company" FOREIGN KEY ("companyId")
          REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_locations_name_normalized" ON "locations" ("nameNormalized")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."ux_locations_name_normalized"`);
    await queryRunner.query(`DROP TABLE "locations"`);
  }
}
