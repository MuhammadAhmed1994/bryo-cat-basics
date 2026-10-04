import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuthTokenType {
  /** Spec 2.5.1.1 — invitation to create an account, valid 72h. */
  INVITATION = 'INVITATION',
  /** Spec 2.1.6.3 — password reset link, valid 48h. */
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * One-time links. Only a SHA-256 hash of the token is stored, so a database
 * leak does not hand out working links.
 */
@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('ux_auth_tokens_hash', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash!: string;

  @Column({ type: 'enum', enum: AuthTokenType })
  type!: AuthTokenType;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  /** Set when a newer token of the same type supersedes this one (spec 2.1.6.3). */
  @Column({ type: 'timestamptz', nullable: true })
  invalidatedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
