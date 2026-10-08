import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocations1791442412122 implements MigrationInterface {
  name = 'CreateLocations1791442412122';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve the original UUIDs so this migration can be rolled back without
    // losing the existing Company identifiers.
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22"`);
    await queryRunner.query(`ALTER TABLE "companies" RENAME COLUMN "id" TO "legacyId"`);
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN "id" character varying(36)`);
    await queryRunner.query(`UPDATE "companies" SET "id" = 'c' || substr(md5("legacyId"::text), 1, 24)`);
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id")`);

    await queryRunner.query(`CREATE TYPE "public"."locations_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`CREATE TABLE "locations" (
      "id" character varying(25) NOT NULL DEFAULT ('c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
      "name" character varying(100) NOT NULL,
      "nameNormalized" character varying(100) NOT NULL,
      "phone" character varying(30),
      "country" character varying(100),
      "stateProvince" character varying(100),
      "city" character varying(100),
      "status" "public"."locations_status_enum" NOT NULL DEFAULT 'ACTIVE',
      "company_id" character varying(36),
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_locations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "ux_locations_name_normalized" ON "locations" ("nameNormalized")`);
    await queryRunner.query(`CREATE INDEX "ix_locations_company_id" ON "locations" ("company_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."ix_locations_company_id"`);
    await queryRunner.query(`DROP INDEX "public"."ux_locations_name_normalized"`);
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP TYPE "public"."locations_status_enum"`);

    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22"`);
    // New Companies created after this migration have a generated legacyId;
    // retain those valid UUIDs when restoring the original primary-key column.
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "companies" RENAME COLUMN "legacyId" TO "id"`);
    await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id")`);
  }
}
