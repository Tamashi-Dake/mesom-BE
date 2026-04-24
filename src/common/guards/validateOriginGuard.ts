import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import type { Request } from 'express'

const getAllowedOrigin = () =>
  process.env.NODE_ENV === 'production' ? process.env.PROD_FRONTEND_URL : process.env.DEV_FRONTEND_URL

@Injectable()
export class ValidateOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    if (request.headers.origin !== getAllowedOrigin()) {
      throw new ForbiddenException('Forbidden origin')
    }
    return true
  }
}
