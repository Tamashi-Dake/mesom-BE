import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { SettingModule } from '~/modules/setting/settingModule.js'

import { ConversationController } from './conversationController.js'
import { ConversationService } from './conversationService.js'

@Module({
  imports: [SettingModule],
  controllers: [ConversationController],
  providers: [ConversationService, JwtAuthGuard]
})
export class ConversationModule {}
