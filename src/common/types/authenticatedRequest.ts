import type { Request } from 'express'
import type { AccessTokenPayload } from '~/util/jwt.js'

export interface AuthenticatedRequest extends Request {
  identify: AccessTokenPayload
  blockedNotification?: boolean
}
