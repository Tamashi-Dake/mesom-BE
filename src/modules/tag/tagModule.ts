import { Module } from '@nestjs/common'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { TagController } from './tagController.js'
import { TagService } from './tagService.js'

@Module({
  controllers: [TagController],
  providers: [TagService, JwtAuthGuard],
  exports: [TagService]
})
export class TagModule {}
