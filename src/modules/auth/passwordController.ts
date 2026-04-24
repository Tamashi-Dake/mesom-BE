import { Body, Controller, HttpCode, HttpStatus, Patch, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ValidateOriginGuard } from '~/common/guards/validateOriginGuard.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { AuthService } from './authService.js'
import { UpdatePasswordDto } from './dto/updatePasswordDto.js'

@Controller()
@UseGuards(JwtAuthGuard, ValidateOriginGuard)
export class PasswordController {
  constructor(private readonly authService: AuthService) {}

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  updatePassword(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdatePasswordDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.updatePassword(user.userId, dto, response)
  }
}
