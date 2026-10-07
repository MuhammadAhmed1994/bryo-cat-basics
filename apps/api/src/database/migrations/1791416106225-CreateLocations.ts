import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocations1791416106225 implements MigrationInterface {
  name = 'CreateLocations1791416106225';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."locations_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "nameNormalized" character varying(100) NOT NULL, "company_id" uuid, "phone" character varying(30), "contactPerson" character varying(255), "contactPersonPhone" character varying(30), "addressLine1" character varying(255), "addressLine2" character varying(255), "country" character varying(100), "stateProvince" character varying(100), "city" character varying(100), "postalCode" character varying(20), "status" "public"."locations_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_locations_name_normalized" ON "locations" ("nameNormalized")`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ADD CONSTRAINT "FK_locations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "locations" DROP CONSTRAINT "FK_locations_company"`,
    );
    await queryRunner.query(`DROP INDEX "public"."ux_locations_name_normalized"`);
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP TYPE "public"."locations_status_enum"`);
  }
}
