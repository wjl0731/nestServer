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
      endpoints: ['/api/health', '/api/chat/models', '/api/chat/completions', '/api/chat/stream']
    }
  }
}
