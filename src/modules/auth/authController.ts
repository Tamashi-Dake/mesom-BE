import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { Public } from '~/common/decorators/public.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ValidateOriginGuard } from '~/common/guards/validateOriginGuard.js'
import type { AccessTokenPayload } from '~/util/jwt.js'
import { REFRESH_COOKIE_NAME } from '~/util/cookieHelper.js'

import { AuthService } from './authService.js'
import { LoginDto } from './dto/loginDto.js'
import { RegisterDto } from './dto/registerDto.js'

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  me(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.getCurrentUser(user.userId)
  }

  @Public()
  @UseGuards(ValidateOriginGuard)
  @Post('register')
  @HttpCode(HttpStatus.OK)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Public()
  @UseGuards(ValidateOriginGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(dto, response)
  }

  @Public()
  @UseGuards(ValidateOriginGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.authService.logout(request.cookies?.[REFRESH_COOKIE_NAME], response)
  }

  @Public()
  @UseGuards(ValidateOriginGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.authService.refresh(request.cookies?.[REFRESH_COOKIE_NAME], response)
  }
}
