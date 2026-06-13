import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { CurrentUser, CurrentUserPayload } from './current-user.decorator'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto, SendEmailCodeDto } from './dto/auth.dto'
import { TokenAuthGuard } from './token-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('captcha')
  captcha() {
    return this.auth.generateCaptcha()
  }

  @Post('email-code')
  @HttpCode(200)
  sendEmailCode(@Body() dto: SendEmailCodeDto) {
    return this.auth.sendEmailCode(dto)
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(TokenAuthGuard)
  logout(@CurrentUser() me: CurrentUserPayload) {
    return this.auth.logoutCurrent(me)
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(TokenAuthGuard)
  logoutAll(@CurrentUser() me: CurrentUserPayload) {
    return this.auth.logoutAll(me.userId)
  }
}
