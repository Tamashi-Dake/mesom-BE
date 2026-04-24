import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '~/common/decorators/public.js'
import type { AuthenticatedRequest } from '~/common/types/authenticatedRequest.js'
import { verifyAccessToken } from '~/util/jwt.js'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.cookies?.['mesom-access']
    if (!token) throw new UnauthorizedException('Unauthorized')

    try {
      request.identify = verifyAccessToken(token)
      return true
    } catch {
      throw new UnauthorizedException('Token invalid or expired')
    }
  }
}
