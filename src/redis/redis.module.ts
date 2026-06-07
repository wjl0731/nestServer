import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new Redis({
          host: config.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: Number(config.get<string>('REDIS_PORT') ?? '6379'),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get<string>('REDIS_DB') ?? '0'),
          lazyConnect: false,
          maxRetriesPerRequest: 3
        })
        client.on('error', (err) => {
          // 仅打印，不让 redis 故障直接挂掉进程
          // eslint-disable-next-line no-console
          console.error('[redis] error:', err.message)
        })
        return client
      }
    }
  ],
  exports: [REDIS_CLIENT]
})
export class RedisModule {}
