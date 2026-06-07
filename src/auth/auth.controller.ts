import { Body, Controller, Get, Post, HttpCode } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto, SendEmailCodeDto } from './dto/auth.dto'

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
}
