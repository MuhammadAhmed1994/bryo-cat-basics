import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791118166028 implements MigrationInterface {
    name = 'InitialSchema1791118166028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('ADMIN', 'FIELD_TECH', 'LAB_TECH')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('INVITED', 'ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid, "updatedById" uuid, "email" character varying(255) NOT NULL, "firstName" character varying(50) NOT NULL, "lastName" character varying(50) NOT NULL, "passwordHash" character varying(255), "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{}', "status" "public"."users_status_enum" NOT NULL DEFAULT 'INVITED', "lastLoginAt" TIMESTAMP WITH TIME ZONE, "lastLogoutAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('INVITATION', 'PASSWORD_RESET')`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying(64) NOT NULL, "type" "public"."auth_tokens_type_enum" NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "consumedAt" TIMESTAMP WITH TIME ZONE, "invalidatedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_auth_tokens_hash" ON "auth_tokens" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_sessions_user" ON "sessions" ("userId") `);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdById" uuid, "updatedById" uuid, "name" character varying(100) NOT NULL, "nameNormalized" character varying(100) NOT NULL, "phone" character varying(30) NOT NULL, "email" character varying(255), "website" character varying(255), "shippingSameAsBilling" boolean NOT NULL DEFAULT true, "isActive" boolean NOT NULL DEFAULT true, "billingLine1" character varying(255), "billingLine2" character varying(255), "billingCountry" character varying(100), "billingState" character varying(100), "billingCity" character varying(100), "billingPostalcode" character varying(20), "shippingLine1" character varying(255), "shippingLine2" character varying(255), "shippingCountry" character varying(100), "shippingState" character varying(100), "shippingCity" character varying(100), "shippingPostalcode" character varying(20), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_companies_name_normalized" ON "companies" ("nameNormalized") `);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_c25fb956ebada4b256501585cca" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_c25fb956ebada4b256501585cca"`);
        await queryRunner.query(`DROP INDEX "public"."ux_companies_name_normalized"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP INDEX "public"."ix_sessions_user"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."ux_auth_tokens_hash"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."auth_tokens_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."ux_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
    }

}
