import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import type { AccessTokenPayload } from '~/util/jwt.js'
import { TimelineService } from './timelineService.js'

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  getTimeline(
    @CurrentUser() user: AccessTokenPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string
  ) {
    const n = parseInt(limit ?? '20')
    return this.timelineService.getTimeline(user.userId, cursor ?? null, isNaN(n) ? 20 : n)
  }
}
