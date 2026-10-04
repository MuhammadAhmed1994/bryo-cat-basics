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

/**
 * Server-side session backing the JWT. The token carries this row's id as its
 * `jti`; deleting the row ends the session immediately, which is what makes
 * logout real (spec 2.1.2 — back-button pages must stop working).
 */
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('ix_sessions_user')
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /** Bumped on every authenticated request; drives 90-day inactivity expiry. */
  @Column({ type: 'timestamptz' })
  lastSeenAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
