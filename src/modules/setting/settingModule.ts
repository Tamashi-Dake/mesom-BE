import { Module } from '@nestjs/common'

import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'

import { SettingController } from './settingController.js'
import { SettingService } from './settingService.js'

@Module({
  controllers: [SettingController],
  providers: [SettingService, JwtAuthGuard],
  exports: [SettingService]
})
export class SettingModule {}
