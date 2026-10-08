import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocations1791451827106 implements MigrationInterface {
    name = 'CreateLocations1791451827106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."locations_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "nameNormalized" character varying(100) NOT NULL, "description" text, "status" "public"."locations_status_enum" NOT NULL DEFAULT 'ACTIVE', "companyId" uuid, "phone" character varying(30), "contactPersonName" character varying(100), "contactPersonPhone" character varying(30), "contactPersonEmail" character varying(255), "addressLine1" character varying(255), "addressLine2" character varying(255), "country" character varying(100), "stateProvince" character varying(100), "city" character varying(100), "postalCode" character varying(20), CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_locations_nameNormalized" UNIQUE ("nameNormalized"))`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_locations_companyId" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_locations_companyId"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TYPE "public"."locations_status_enum"`);
    }
}
