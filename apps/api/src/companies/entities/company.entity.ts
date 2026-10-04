import { Column, Entity, Index } from 'typeorm';
import { AuditedEntity } from '../../common/entities/audited.entity';

/** Spec 2.8.1 — billing and shipping share the same shape and validations. */
export class Address {
  @Column({ type: 'varchar', length: 255, nullable: true })
  line1!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  line2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;
}

@Entity('companies')
export class Company extends AuditedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /**
   * Lower-cased copy of `name`, uniquely indexed, so the duplicate check is
   * case-insensitive (spec 2.8.1) without a functional index.
   */
  @Index('ux_companies_name_normalized', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  nameNormalized!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @Column(() => Address, { prefix: 'billing' })
  billingAddress!: Address;

  @Column({ type: 'boolean', default: true })
  shippingSameAsBilling!: boolean;

  @Column(() => Address, { prefix: 'shipping' })
  shippingAddress!: Address;

  /** Spec 2.8.5 — new companies are Active; deactivation hides them from new transactions. */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
