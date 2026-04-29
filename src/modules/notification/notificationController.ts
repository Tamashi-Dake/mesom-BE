import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards
} from '@nestjs/common'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { ParseObjectIdPipe } from '~/common/pipes/parseObjectIdPipe.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { NotificationService } from './notificationService.js'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('mentions')
  getMentions(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.notificationService.getUserMentions(
      user.userId,
      parseInt(limit ?? '10') || 10,
      parseInt(skip ?? '0') || 0
    )
  }

  @Get()
  getNotifications(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.notificationService.getUserNotifications(
      user.userId,
      parseInt(limit ?? '10') || 10,
      parseInt(skip ?? '0') || 0
    )
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  toggleRead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) notificationId: string
  ) {
    return this.notificationService.toggleRead(user.userId, notificationId)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: AccessTokenPayload) {
    return this.notificationService.markAllRead(user.userId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseObjectIdPipe) notificationId: string
  ) {
    return this.notificationService.delete(user.userId, notificationId)
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteAll(@CurrentUser() user: AccessTokenPayload) {
    return this.notificationService.deleteAll(user.userId)
  }
}
