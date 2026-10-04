import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';
import { AuditedEntity } from '../../common/entities/audited.entity';

/** Spec 2.5.1 — Admin / Field Tech / Lab Tech. Permissions are additive (spec 2.5.7.1). */
export enum UserRole {
  ADMIN = 'ADMIN',
  FIELD_TECH = 'FIELD_TECH',
  LAB_TECH = 'LAB_TECH',
}

/** Spec 2.1.1.5 + 2.5.1 — invited users are not yet active and cannot log in. */
export enum UserStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('users')
export class User extends AuditedEntity {
  /**
   * Stored lower-cased so uniqueness is case-insensitive across active and
   * inactive users (spec 2.5.1). Login is likewise case-insensitive (spec 2.1.1.1).
   */
  @Index('ux_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50 })
  firstName!: string;

  @Column({ type: 'varchar', length: 50 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'enum', enum: UserRole, array: true, default: '{}' })
  roles!: UserRole[];

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INVITED })
  status!: UserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogoutAt!: Date | null;

  /** Spec 2.5.4 — users with history are soft deleted, never purged. */
  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
