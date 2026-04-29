import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards
} from '@nestjs/common'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { UpdateDisplaySettingDto } from './dto/updateDisplaySettingDto.js'
import { UpdateSettingDto } from './dto/updateSettingDto.js'
import { SettingService } from './settingService.js'

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('display')
  getDisplay(@CurrentUser() user: AccessTokenPayload) {
    return this.settingService.getDisplayByUser(user.userId)
  }

  @Get()
  getSetting(@CurrentUser() user: AccessTokenPayload) {
    return this.settingService.getByUser(user.userId)
  }

  @Patch('display')
  @HttpCode(HttpStatus.OK)
  updateDisplay(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateDisplaySettingDto
  ) {
    return this.settingService.updateDisplayByUser(user.userId, dto.theme, dto.accent)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  updateSetting(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateSettingDto
  ) {
    return this.settingService.updateByUser(user.userId, dto.setting)
  }
}
