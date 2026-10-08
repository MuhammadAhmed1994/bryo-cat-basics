import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { LocationStatus } from './location-status.enum';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Index('ux_locations_name_normalized', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  nameNormalized!: string;

  @Column({ type: 'uuid', nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, (company) => company.locations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companyId' })
  company?: Company | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPerson!: string | null;

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

  @Column({ type: 'enum', enum: LocationStatus, default: LocationStatus.ACTIVE })
  status!: LocationStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
