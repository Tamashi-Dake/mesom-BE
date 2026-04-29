import { Controller, Get, Query, UseGuards } from '@nestjs/common'

import { CurrentUser } from '~/common/decorators/currentUser.js'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import type { AccessTokenPayload } from '~/util/jwt.js'

import { SearchService } from './searchService.js'

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  searchUsers(
    @Query('query') query: string = '',
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.searchService.searchUsers(
      query,
      parseInt(limit ?? '10') || 10,
      parseInt(skip ?? '0') || 0
    )
  }

  @Get('conversations')
  searchConversations(
    @CurrentUser() user: AccessTokenPayload,
    @Query('query') query: string = '',
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.searchService.searchConversations(
      user.userId,
      query,
      parseInt(limit ?? '10') || 10,
      parseInt(skip ?? '0') || 0
    )
  }
}
