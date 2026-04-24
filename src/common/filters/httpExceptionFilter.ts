import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import type { Response } from 'express'

interface ErrorPayload {
  success: false
  code: string
  message: string
  data: null
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const res = exception.getResponse()
      const { code, message } = this.normalize(res, status)
      const payload: ErrorPayload = { success: false, code, message, data: null }
      return response.status(status).json(payload)
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
      'UnhandledException'
    )
    const payload: ErrorPayload = {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      data: null
    }
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload)
  }

  private normalize(res: string | object, status: number): { code: string; message: string } {
    if (typeof res === 'string') {
      return { code: this.statusToCode(status), message: res }
    }
    const body = res as { message?: string | string[]; error?: string; code?: string }
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? body.error ?? 'Error'
    const code = body.code ?? this.statusToCode(status)
    return { code, message }
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST'
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED'
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN'
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND'
      case HttpStatus.CONFLICT:
        return 'CONFLICT'
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS'
      default:
        return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'
    }
  }
}
