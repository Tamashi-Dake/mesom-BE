import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { NotificationModule } from '~/modules/notification/notificationModule.js'
import { SettingModule } from '~/modules/setting/settingModule.js'

import { PostController } from './postController.js'
import { PostService } from './postService.js'

@Module({
  imports: [NotificationModule, SettingModule],
  controllers: [PostController],
  providers: [PostService, JwtAuthGuard]
})
export class PostModule {}
