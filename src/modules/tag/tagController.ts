import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { TagService } from './tagService.js'

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get('trending')
  getTrending(@Query('limit') limit?: string) {
    const n = parseInt(limit ?? '20')
    return this.tagService.getTrending(isNaN(n) ? 20 : n)
  }

  @Get('search')
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const n = parseInt(limit ?? '10')
    return this.tagService.search(q ?? '', isNaN(n) ? 10 : n)
  }
}
