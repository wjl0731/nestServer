import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { ChatModule } from './chat/chat.module'
import { MatchModule } from './match/match.module'
import { MailModule } from './mail/mail.module'
import { RedisModule } from './redis/redis.module'
import { User } from './user/user.entity'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('MYSQL_HOST') ?? '127.0.0.1',
        port: Number(config.get<string>('MYSQL_PORT') ?? '3306'),
        username: config.get<string>('MYSQL_USERNAME') ?? 'root',
        password: config.get<string>('MYSQL_PASSWORD') ?? '',
        database: config.get<string>('MYSQL_DATABASE') ?? 'nest_app',
        entities: [User],
        autoLoadEntities: true,
        synchronize: String(config.get<string>('MYSQL_SYNCHRONIZE') ?? 'false') === 'true',
        charset: 'utf8mb4_unicode_ci',
        timezone: 'Z'
      })
    }),
    RedisModule,
    MailModule,
    AuthModule,
    UserModule,
    ChatModule,
    MatchModule
  ],
  controllers: [AppController]
})
export class AppModule {}
