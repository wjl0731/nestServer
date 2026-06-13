import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../user/user.entity'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { TokenAuthGuard } from './token-auth.guard'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, TokenAuthGuard],
  exports: [AuthService, TokenAuthGuard]
})
export class AuthModule {}
