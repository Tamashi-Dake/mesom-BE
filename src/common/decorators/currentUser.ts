import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from '~/common/types/authenticatedRequest.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.identify
  }
)
