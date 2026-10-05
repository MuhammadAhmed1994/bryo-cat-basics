import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // Audit fields follow migration naming (added/updated by)
  @Column({ type: 'uuid', nullable: true })
  addedById!: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Index('ux_locations_name_normalized', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  nameNormalized!: string;

  @Column({ type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPersonName!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPersonPhone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine1!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stateProvince!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'enum', enum: ['ACTIVE', 'INACTIVE'], enumName: 'location_status', default: 'ACTIVE' })
  status!: LocationStatus;
}
