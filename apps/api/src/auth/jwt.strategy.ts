import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  jti?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'dev-only-change-me',
      jwtid: undefined,
    });
  }

  /**
   * A valid signature is not enough: the session row must still exist and be
   * within the inactivity window (spec 2.1.2, 2.1.3).
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload.jti) throw new UnauthorizedException();
    const user = await this.auth.validateSession(payload.jti);
    return { ...user, sessionId: payload.jti };
  }
}
