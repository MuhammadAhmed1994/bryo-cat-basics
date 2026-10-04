import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Spec 2.5.7.1 — permissions are additive: holding any one of the listed roles
 * is enough.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
