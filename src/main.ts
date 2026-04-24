import 'reflect-metadata'
import 'module-alias/register.js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import compression from 'compression'

import { AppModule } from './appModule.js'
import legacyApp from './legacyApp.js'
import corsOptions from './config/corsOptions.js'
import './config/cloudinary.js'
import setupSocket from './lib/socket/index.js'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true
  })

  app.use(cookieParser())
  app.enableCors(corsOptions)
  app.use(compression())

  // Phase 0: mount Express legacy app — every existing route still works.
  // Removed gradually in Phase 2 as modules cut over; folder deleted in Phase 6.
  app.use(legacyApp)

  // Socket.IO migrated to AppGateway in Phase 4. Until then run legacy setup.
  setupSocket(app.getHttpServer())

  const isProd = process.env.NODE_ENV === 'production'
  const PORT = isProd ? process.env.PORT || process.env.PROD_PORT : process.env.DEV_PORT

  await app.listen(PORT ?? 8080)
  console.log(`Server running at port ${PORT}`)
}

bootstrap()
