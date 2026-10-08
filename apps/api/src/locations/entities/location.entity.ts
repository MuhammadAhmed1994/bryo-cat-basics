import { randomBytes } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('locations')
export class Location {
  @PrimaryColumn({ type: 'varchar', length: 25 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Index('ux_locations_name_normalized', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  nameNormalized!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stateProvince!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'enum', enum: LocationStatus, default: LocationStatus.ACTIVE })
  status!: LocationStatus;

  @Index('ix_locations_company_id')
  @Column({ name: 'company_id', type: 'varchar', length: 36, nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, (company) => company.locations, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company?: Company | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) {
      this.id = `c${randomBytes(12).toString('hex')}`;
    }
  }
}
