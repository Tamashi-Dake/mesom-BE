import 'reflect-metadata'
import 'module-alias/register.js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import compression from 'compression'

import { AppModule } from './appModule.js'
import legacyApp from './legacyApp.js'
import corsOptions from './config/corsOptions.js'
import './config/cloudinary.js'
import setupSocket from './lib/socket/index.js'
import connectMongoDB from './db/connectMongoDB.js'
import { HttpExceptionFilter } from './common/filters/httpExceptionFilter.js'
import { TransformInterceptor } from './common/interceptors/transformInterceptor.js'

async function bootstrap() {
  // Connect legacy mongoose singleton before Nest spins up so legacy `.model.js`
  // files have an open connection. @nestjs/mongoose shares the same default
  // connection, so this is idempotent. Removed once the last legacy model is
  // migrated (Phase 3).
  await connectMongoDB()

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true
  })

  app.use(cookieParser())
  app.enableCors(corsOptions)
  app.use(compression())

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  // Phase 0: mount Express legacy app — every existing route still works.
  // Legacy routes bypass the Nest pipeline, so the envelope/interceptor above
  // only wraps newly migrated controllers. Removed per-module in Phase 2.
  app.use(legacyApp)

  // Socket.IO migrated to AppGateway in Phase 4. Until then run legacy setup.
  setupSocket(app.getHttpServer())

  const isProd = process.env.NODE_ENV === 'production'
  const PORT = isProd ? process.env.PORT || process.env.PROD_PORT : process.env.DEV_PORT

  await app.listen(PORT ?? 8080)
  console.log(`Server running at port ${PORT}`)
}

bootstrap()
