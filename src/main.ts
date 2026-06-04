import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false })

  const config = app.get(ConfigService)
  const port = Number(config.get<string>('PORT') ?? '3000')
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? '*'

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  )

  await app.listen(port, '0.0.0.0')

  const logger = new Logger('Bootstrap')
  logger.log(`NestJS server listening on port ${port} with prefix /api`)
}

bootstrap()
