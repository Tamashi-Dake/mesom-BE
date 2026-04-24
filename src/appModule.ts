import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

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
    })
  ]
})
export class AppModule {}
