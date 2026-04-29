import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from './modules/auth/authModule.js'
import { ConversationModule } from './modules/conversation/conversationModule.js'
import { NotificationModule } from './modules/notification/notificationModule.js'
import { PostModule } from './modules/post/postModule.js'
import { SearchModule } from './modules/search/searchModule.js'
import { SettingModule } from './modules/setting/settingModule.js'
import { UserModule } from './modules/user/userModule.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('NODE_ENV') === 'production'
            ? config.get<string>('MONGO_PROD_URI')
            : config.get<string>('MONGO_URI')
      })
    }),
    UserModule,
    AuthModule,
    NotificationModule,
    SettingModule,
    PostModule,
    SearchModule,
    ConversationModule
  ]
})
export class AppModule {}
