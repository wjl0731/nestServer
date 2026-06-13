import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator'
import { TokenAuthGuard } from '../auth/token-auth.guard'
import { UpdateUserInfoDto } from './dto/user.dto'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(TokenAuthGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get('info')
  getInfo(@CurrentUser() me: CurrentUserPayload) {
    return this.users.getInfo(me.userId)
  }

  @Put('info')
  updateInfo(@CurrentUser() me: CurrentUserPayload, @Body() dto: UpdateUserInfoDto) {
    return this.users.updateInfo(me.userId, dto)
  }
}
