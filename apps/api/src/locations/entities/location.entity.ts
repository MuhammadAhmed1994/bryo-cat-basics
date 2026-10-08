import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('locations')
@Unique('UQ_locations_nameNormalized', ['nameNormalized'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  nameNormalized!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    enumName: 'locations_status_enum',
    default: LocationStatus.ACTIVE,
  })
  status!: LocationStatus;

  @Column({ type: 'uuid', nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, (company) => company.locations, { nullable: true })
  @JoinColumn({
    name: 'companyId',
    foreignKeyConstraintName: 'FK_locations_companyId',
  })
  company!: Company | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPersonName!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPersonPhone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactPersonEmail!: string | null;

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
}
