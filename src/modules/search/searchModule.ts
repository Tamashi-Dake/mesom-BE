import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'

import { SearchController } from './searchController.js'
import { SearchService } from './searchService.js'

@Module({
  controllers: [SearchController],
  providers: [SearchService, JwtAuthGuard]
})
export class SearchModule {}
