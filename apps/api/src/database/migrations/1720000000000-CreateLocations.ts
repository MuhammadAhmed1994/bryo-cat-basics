import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLocations1720000000000 implements MigrationInterface {
    name = 'CreateLocations1720000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // status enum for locations
        await queryRunner.query(`CREATE TYPE "public"."location_status" AS ENUM('ACTIVE', 'INACTIVE')`);

        // locations table
        await queryRunner.query(`
            CREATE TABLE "locations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdById" uuid,
                "updatedById" uuid,
                "name" character varying(100) NOT NULL,
                "nameNormalized" character varying(100) NOT NULL,
                "companyId" uuid,
                "phone" character varying(30),
                "contactPersonName" character varying(100),
                "contactPersonPhone" character varying(30),
                "addressLine1" character varying(255),
                "addressLine2" character varying(255),
                "country" character varying(100),
                "stateProvince" character varying(100),
                "city" character varying(100),
                "postalCode" character varying(20),
                "status" "public"."location_status" NOT NULL DEFAULT 'ACTIVE',
                CONSTRAINT "PK_7f8b2365b91b02c1b9a22f1a8ae" PRIMARY KEY ("id")
            )
        `);

        // indexes to support queries and filters
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_locations_name_normalized" ON "locations" ("nameNormalized") `);
        await queryRunner.query(`CREATE INDEX "ix_locations_name" ON "locations" ("name") `);
        await queryRunner.query(`CREATE INDEX "ix_locations_status" ON "locations" ("status") `);
        await queryRunner.query(`CREATE INDEX "ix_locations_country" ON "locations" ("country") `);
        await queryRunner.query(`CREATE INDEX "ix_locations_company" ON "locations" ("companyId") `);

        // foreign keys
        await queryRunner.query(`
            ALTER TABLE "locations"
            ADD CONSTRAINT "FK_locations_company" FOREIGN KEY ("companyId")
            REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "locations"
            ADD CONSTRAINT "FK_locations_created_by" FOREIGN KEY ("createdById")
            REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "locations"
            ADD CONSTRAINT "FK_locations_updated_by" FOREIGN KEY ("updatedById")
            REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // drop indexes first
        await queryRunner.query(`DROP INDEX "public"."ix_locations_company"`);
        await queryRunner.query(`DROP INDEX "public"."ix_locations_country"`);
        await queryRunner.query(`DROP INDEX "public"."ix_locations_status"`);
        await queryRunner.query(`DROP INDEX "public"."ix_locations_name"`);
        await queryRunner.query(`DROP INDEX "public"."ux_locations_name_normalized"`);

        // drop the table (drops FKs as well)
        await queryRunner.query(`DROP TABLE "locations"`);

        // drop enum type
        await queryRunner.query(`DROP TYPE "public"."location_status"`);
    }
}
