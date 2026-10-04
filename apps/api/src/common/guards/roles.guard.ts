import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { RequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user: RequestUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException();

    // Spec 2.5.7.1 — additive: one matching role grants the action.
    const allowed = required.some((role) => user.roles.includes(role));
    if (!allowed) throw new ForbiddenException('You do not have access to this action.');
    return true;
  }
}
