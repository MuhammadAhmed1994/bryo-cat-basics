import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateLocations1791442412122 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve a reversible, stable mapping of each existing UUID to a cuid-style
    // string. The leading "c" distinguishes these IDs from their former UUIDs.
    await queryRunner.dropPrimaryKey('companies');
    await queryRunner.changeColumn(
      'companies',
      'id',
      new TableColumn({
        name: 'id',
        type: 'varchar',
        length: '36',
        isNullable: false,
      }),
    );
    await queryRunner.manager
      .createQueryBuilder()
      .update('companies')
      .set({ id: () => `'c' || replace("id"::text, '-', '')` })
      .execute();
    await queryRunner.createPrimaryKey('companies', ['id']);

    await queryRunner.createTable(
      new Table({
        name: 'locations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'nameNormalized',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'stateProvince',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'locations_status_enum',
            enum: ['ACTIVE', 'INACTIVE'],
            default: "'ACTIVE'",
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        uniques: [
          new TableUnique({
            name: 'ux_locations_name_normalized',
            columnNames: ['nameNormalized'],
          }),
        ],
        indices: [
          new TableIndex({
            name: 'ix_locations_company_id',
            columnNames: ['company_id'],
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_locations_company_id',
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('locations', true, true, true);

    // Restore legacy UUIDs exactly. Company IDs created after this migration do
    // not have a reversible legacy mapping, so assign them fresh UUIDs on down.
    await queryRunner.manager
      .createQueryBuilder()
      .update('companies')
      .set({
        id: () =>
          `CASE WHEN "id" ~ '^c[0-9a-f]{32}$' THEN substring("id" from 2 for 8) || '-' || substring("id" from 10 for 4) || '-' || substring("id" from 14 for 4) || '-' || substring("id" from 18 for 4) || '-' || substring("id" from 22 for 12) ELSE uuid_generate_v4()::text END`,
      })
      .execute();
    await queryRunner.dropPrimaryKey('companies');
    await queryRunner.changeColumn(
      'companies',
      'id',
      new TableColumn({
        name: 'id',
        type: 'uuid',
        default: 'uuid_generate_v4()',
        isNullable: false,
      }),
    );
    await queryRunner.createPrimaryKey('companies', ['id']);
  }
}
