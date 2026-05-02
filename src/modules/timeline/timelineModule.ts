import { Module } from '@nestjs/common'
import { JwtAuthGuard } from '~/common/guards/jwtAuthGuard.js'
import { SettingModule } from '~/modules/setting/settingModule.js'
import { TimelineController } from './timelineController.js'
import { TimelineService } from './timelineService.js'

@Module({
  imports: [SettingModule],
  controllers: [TimelineController],
  providers: [TimelineService, JwtAuthGuard]
})
export class TimelineModule {}
