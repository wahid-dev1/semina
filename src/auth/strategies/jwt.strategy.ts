import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/database/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Check if session exists in Redis
    const sessionId = payload.sessionId || payload.sid;
    if (!sessionId) {
      throw new UnauthorizedException('Session expired');
    }

    const sessionData = await this.redisService.get(`session:${sessionId}`);
    if (!sessionData) {
      throw new UnauthorizedException('Session expired');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
      type: payload.type,
      sessionId,
    };
  }
}
