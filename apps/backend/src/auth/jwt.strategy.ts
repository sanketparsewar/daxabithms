import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { SessionUser } from '@daxabithms/types';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
}

const cookieExtractor = (req: {
  cookies?: Record<string, string>;
}): string | null => {
  return (
    req.cookies?.['daxabithms_session'] ??
    req.cookies?.['nodedr_session'] ??
    null
  );
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Short-lived in-memory cache (15s TTL) to prevent repeated heavy relational user+role+permission
  // queries on every single HTTP request during concurrent shifts.
  private readonly sessionCache = new Map<
    string,
    { user: SessionUser; expiresAt: number }
  >();

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<SessionUser> {
    const now = Date.now();
    const cached = this.sessionCache.get(payload.sub);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user || !user.isActive) {
      this.sessionCache.delete(payload.sub);
      throw new UnauthorizedException('Session no longer valid');
    }

    const sessionUser: SessionUser = {
      id: user.id,
      restaurantId: user.restaurantId,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
    };

    this.sessionCache.set(payload.sub, {
      user: sessionUser,
      expiresAt: now + 15_000,
    });
    return sessionUser;
  }
}
