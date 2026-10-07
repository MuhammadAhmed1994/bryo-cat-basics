import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AuditedEntity } from '../../common/entities/audited.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('locations')
@Index('ux_locations_name_normalized', ['nameNormalized'], { unique: true })
export class Location extends AuditedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  nameNormalized!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'uuid', nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, (company) => company.locations, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'companyId', referencedColumnName: 'id' })
  company?: Company | null;

  @Column({ type: 'varchar', length: 100 })
  country!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stateProvince!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
