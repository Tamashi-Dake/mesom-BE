import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'

import { NotificationController } from './notificationController.js'
import { NotificationService } from './notificationService.js'

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, JwtAuthGuard],
  exports: [NotificationService]
})
export class NotificationModule {}
