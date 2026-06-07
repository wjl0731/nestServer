import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { ok: true, ts: Date.now() }
  }

  @Get()
  index() {
    return {
      name: 'nestjs-server',
      endpoints: [
        '/api/health',
        '/api/auth/captcha',
        '/api/auth/email-code',
        '/api/auth/register',
        '/api/auth/login',
        '/api/user/info',
        '/api/chat/models',
        '/api/chat/completions',
        '/api/chat/stream'
      ]
    }
  }
}
