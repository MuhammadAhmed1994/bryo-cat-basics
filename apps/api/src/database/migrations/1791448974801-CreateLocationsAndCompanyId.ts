import { randomBytes } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationsAndCompanyId1791448974801 implements MigrationInterface {
  name = 'CreateLocationsAndCompanyId1791448974801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22"`);
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "id" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "id" TYPE character varying(25) USING "id"::text`);

    const companies: Array<{ id: string }> = await queryRunner.query(`SELECT "id" FROM "companies"`);
    let counter = 0;
    for (const company of companies) {
      counter += 1;
      const timestamp = Date.now().toString(36).padStart(8, '0');
      const id = `c${timestamp}${counter.toString(36).padStart(4, '0')}${randomBytes(8).toString('hex').slice(0, 12)}`;
      await queryRunner.query(`UPDATE "companies" SET "id" = $1 WHERE "id" = $2`, [id, company.id]);
    }
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")`);

    await queryRunner.query(`CREATE TYPE "public"."locations_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`CREATE TABLE "locations" (
      "id" character varying(25) NOT NULL,
      "name" character varying(100) NOT NULL,
      "phone" character varying,
      "contactPersonPhone" character varying,
      "country" character varying,
      "stateProvince" character varying,
      "city" character varying,
      "status" "public"."locations_status_enum" NOT NULL DEFAULT 'ACTIVE',
      "companyId" character varying(25),
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_locations_id" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "ux_locations_name_lower" ON "locations" (LOWER("name"))`);
    await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_locations_company_id" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_locations_company_id"`);
    await queryRunner.query(`DROP INDEX "public"."ux_locations_name_lower"`);
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP TYPE "public"."locations_status_enum"`);

    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "PK_companies_id"`);
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "id" TYPE uuid USING uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id")`);
  }
}
